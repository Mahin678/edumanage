// app/api/submissions/route.ts

import { prisma } from "@/app/prisma";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
// app/api/submissions/route.ts

// ─── GET /api/submissions?studentId=xxx ──────────────────────────────────────
// studentId here = the human-readable studentId field on User (e.g. "STU-001")
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

    // First find the user to get their internal id
    const user = await prisma.user.findUnique({
      where: { studentId },
    });

    if (!user) {
      // No user found — just return empty list, not an error
      return NextResponse.json({ success: true, data: [] });
    }

    const submissions = await prisma.submission.findMany({
      where: { userId: user.id },   // use internal id for the FK
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
// Accepts multipart/form-data: file, studentId, assessmentId
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

    // ── Look up user by their human-readable studentId ────────────────────
    const user = await prisma.user.findUnique({
      where: { studentId },
    });

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

    // ── Determine if late ─────────────────────────────────────────────────
    const now    = new Date();
    const isLate = now > new Date(assessment.deadline);

    // ── Save file to disk ─────────────────────────────────────────────────
    // Replace writeFile with S3/Cloudflare R2 in production
    const uploadDir = path.join(process.cwd(), "public", "uploads", "submissions");
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${user.id}_${assessmentId}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, safeName);
    const buffer   = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/submissions/${safeName}`;

    // ── Upsert: one submission per user per assessment ────────────────────
    const existing = await prisma.submission.findUnique({
      where: {
        userId_assessmentId: { userId: user.id, assessmentId },
      },
    });

    let submission;
    if (existing) {
      submission = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          fileUrl,
          fileName:    file.name,
          submittedAt: now,
          isLate,
          status:      "Pending",  // reset to Pending on resubmission
        },
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          userId:      user.id,    // internal FK — always resolves correctly
          assessmentId,
          fileUrl,
          fileName:    file.name,
          submittedAt: now,
          isLate,
          status:      "Pending",
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