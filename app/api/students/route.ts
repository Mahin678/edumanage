import { prisma } from "@/app/prisma";
import { NextRequest, NextResponse } from "next/server";
/**
 * GET /api/students
 * Fetch all students from database
 */

/**
 * POST /api/students
 * Create a new student
 * Body: { name: string, email: string }
 */

type PrismaError = {
  code?: string;
  meta?: Record<string, unknown>;
  message?: string;
};

function isPrismaError(error: unknown): error is PrismaError {
  return typeof error === "object" && error !== null && "code" in error;
}


export async function generateStudentId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `STU-${year}-`;

  // Find the highest sequence number for this year
  const lastStudent = await prisma.user.findFirst({
    where: {
      studentId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      studentId: "desc",
    },
    select: {
      studentId: true,
    },
  });

  let nextSeq = 1;
  if (lastStudent?.studentId) {
    const lastSeq = parseInt(lastStudent.studentId.replace(prefix, ""), 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      dateOfBirth,
      programmeId,   // ← just a string, no lookup needed
      academicYear,
      status,
    } = body;

    // ---------- Required field validation ----------
    const missingFields: string[] = [];
    if (!fullName) missingFields.push("fullName");
    if (!email) missingFields.push("email");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: `The following fields are required: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (typeof fullName !== "string" || typeof email !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid field types",
          message: "'fullName' and 'email' must be strings",
        },
        { status: 400 }
      );
    }

    if (dateOfBirth && typeof dateOfBirth !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid field", message: "'dateOfBirth' must be a string" },
        { status: 400 }
      );
    }

    // ---------- Email validation ----------
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email", message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // ---------- Date validation ----------
    let parsedDOB: Date | null = null;
    if (dateOfBirth) {
      parsedDOB = new Date(dateOfBirth);
      if (isNaN(parsedDOB.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid date", message: "'dateOfBirth' is not a valid date" },
          { status: 400 }
        );
      }
    }

    // ---------- Generate student ID ----------
    const studentId = await generateStudentId();

    // ---------- Create student ----------
    const newStudent = await prisma.user.create({
      data: {
        studentId,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        dateOfBirth: parsedDOB,
        programmeId: programmeId?.trim() || null,   // ← straight string, no relation
        academicYear: academicYear?.trim() || null,
        status: status?.trim() || "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newStudent,
        message: "Student created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/students] Error:", error);

    if (isPrismaError(error)) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[]) ?? [];
        const field = target[0] ?? "field";
        return NextResponse.json(
          {
            success: false,
            error: "Duplicate entry",
            message: `A student with this ${field} already exists`,
          },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid reference",
            message: "One of the referenced values does not exist",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create student",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const students = await prisma.user.findMany();
    
    return NextResponse.json(
      {
        success: true,
        data: students,
        count: students.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/students] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch students",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
