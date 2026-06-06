import { prisma } from "@/app/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch all submissions with grades
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("assessmentId");
    
    const whereClause = assessmentId ? { assessmentId: parseInt(assessmentId) } : {};
    
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
            programmeId: true,  // Include programmeId to reference
          },
        },
        assessment: {
          select: {
            id: true,
            name: true,
            deadline: true,
          },
        },
        grade: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    // If you need programme name, you can fetch programmes separately
    // or include the relation if you add it to the schema
    
    return NextResponse.json({ success: true, data: submissions });
  } catch (error) {
    console.error("[GET /api/grades]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// POST - Create or update grade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      assessmentId, 
      submissionId, 
      score,
      gradedBy 
    } = body;

    // Validate score
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json(
        { success: false, error: "Score must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Calculate classification
    let classification: string;
    if (score >= 70) classification = "Distinction";
    else if (score >= 60) classification = "Merit";
    else if (score >= 40) classification = "Pass";
    else classification = "Fail";

    // Upsert grade
    const grade = await prisma.grade.upsert({
      where: {
        submissionId: submissionId,
      },
      update: {
        score,
        classification,
        gradedBy,
        gradedAt: new Date(),
      },
      create: {
        userId,
        assessmentId: parseInt(assessmentId),
        submissionId,
        score,
        classification,
        gradedBy,
      },
    });

    return NextResponse.json({ success: true, data: grade });
  } catch (error) {
    console.error("[POST /api/grades]", error);
    return NextResponse.json(
      { success: false, error: "Failed to save grade" },
      { status: 500 }
    );
  }
}

// PATCH - Publish/Unpublish grade
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { gradeId, isPublished } = body;

    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: { isPublished },
    });

    return NextResponse.json({ success: true, data: grade });
  } catch (error) {
    console.error("[PATCH /api/grades]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update publication status" },
      { status: 500 }
    );
  }
}