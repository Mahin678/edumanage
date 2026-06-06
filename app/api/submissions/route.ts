// app/api/submissions/route.ts

import { prisma } from "@/app/prisma";
import { mkdir, unlink, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
// app/api/submissions/route.ts

// ─── GET /api/submissions?studentId=xxx ──────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "studentId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { studentId } });

    if (!user) {
      return NextResponse.json({ success: true, data: [] });
    }

    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: submissions });
  } catch (error) {
    console.error("[GET /api/submissions]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// ─── POST /api/submissions ────────────────────────────────────────────────────
// Rules:
//   no row yet          → 1st submission  ✅ allowed
//   submissionCount = 1 → 2nd submission  ✅ allowed (replaces file)
//   submissionCount ≥ 2 → LOCKED          ❌ rejected
export async function POST(request: NextRequest) {
  try {
    const formData        = await request.formData();
    const file            = formData.get("file")         as File   | null;
    const studentId       = formData.get("studentId")    as string | null;
    const assessmentIdRaw = formData.get("assessmentId") as string | null;

    // ── Validation ────────────────────────────────────────────────────────
    if (!file || !studentId || !assessmentIdRaw) {
      return NextResponse.json(
        { success: false, error: "file, studentId and assessmentId are required" },
        { status: 400 }
      );
    }

    const assessmentId = parseInt(assessmentIdRaw, 10);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { success: false, error: "assessmentId must be a number" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) {
      return NextResponse.json(
        { success: false, error: "Only PDF or DOCX files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File must be under 10 MB" },
        { status: 400 }
      );
    }

    // ── Look up user ──────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { studentId } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: `No student found with studentId "${studentId}"` },
        { status: 404 }
      );
    }

    // ── Look up assessment ────────────────────────────────────────────────
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: "Assessment not found" },
        { status: 404 }
      );
    }

    // ── Check existing submission ─────────────────────────────────────────
    const existing = await prisma.submission.findUnique({
      where: { userId_assessmentId: { userId: user.id, assessmentId } },
    });

    // ── LOCK after 2nd submission ─────────────────────────────────────────
    if (existing && existing.submissionCount >= 2) {
      return NextResponse.json(
        {
          success: false,
          error:   "Submission locked. You have already used your resubmission attempt.",
          locked:  true,   // frontend reads this flag to show lock UI
        },
        { status: 403 }
      );
    }

    // ── Determine if late ─────────────────────────────────────────────────
    const now    = new Date();
    const isLate = now > new Date(assessment.deadline);

    // ── Delete old file from disk (resubmission only) ─────────────────────
    if (existing?.fileUrl) {
      try {
        const oldFilePath = path.join(process.cwd(), "public", existing.fileUrl);
        await unlink(oldFilePath);
      } catch (unlinkErr) {
        console.warn("[POST /api/submissions] Could not delete old file:", unlinkErr);
      }
    }

    // ── Save new file to disk ─────────────────────────────────────────────
    const uploadDir = path.join(process.cwd(), "public", "uploads", "submissions");
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${user.id}_${assessmentId}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, safeName);
    const buffer   = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/submissions/${safeName}`;

    // ── Upsert with count ─────────────────────────────────────────────────
    let submission;
    if (existing) {
      // 2nd submission → update row, bump count 1 → 2
      submission = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          fileUrl,
          fileName:        file.name,
          submittedAt:     now,
          isLate,
          status:          "Pending",
          submissionCount: { increment: 1 },
        },
      });
    } else {
      // 1st submission → create row with count = 1
      submission = await prisma.submission.create({
        data: {
          userId:          user.id,
          assessmentId,
          fileUrl,
          fileName:        file.name,
          submittedAt:     now,
          isLate,
          status:          "Pending",
          submissionCount: 1,
        },
      });
    }

    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error("[POST /api/submissions]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
