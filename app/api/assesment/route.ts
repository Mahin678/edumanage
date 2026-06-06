import { prisma } from "@/app/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all assessments
export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany({
      orderBy: {
        createdDate: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: assessments,
      message: "Assessments retrieved successfully",
    });
  } catch (error) {
    console.error("GET Assessment Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve assessments",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST create new assessment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, createdDate, deadline, description } = body;

    // Validation
    if (!name || !deadline || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: name, deadline, description",
        },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.create({
      data: {
        name,
        createdDate: new Date(createdDate || new Date()),
        deadline: new Date(deadline),
        description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: assessment,
        message: "Assessment created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Assessment Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create assessment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
