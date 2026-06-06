// app/api/student/results/route.ts
import { prisma } from "@/app/prisma";
import { NextRequest, NextResponse } from "next/server";
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

    // Find user by studentId
    const user = await prisma.user.findUnique({
      where: { studentId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Student not found with this ID" },
        { status: 404 }
      );
    }

    // Fetch only published grades
    const grades = await prisma.grade.findMany({
      where: {
        userId: user.id,
        isPublished: true, // Only published results
      },
      include: {
        assessment: {
          select: {
            id: true,
            name: true,
            deadline: true,
          },
        },
        submission: {
          select: {
            fileUrl: true,
            fileName: true,
            isLate: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { gradedAt: "desc" },
    });

    return NextResponse.json({ 
      success: true, 
      data: grades,
      studentName: user.name 
    });
  } catch (error) {
    console.error("[GET /api/student/results]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}