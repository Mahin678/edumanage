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
      programmeId,
      academicYear,
      status,
      // ✅ New payment fields
      halfDueDate,
      halfPaidDate,
      halfReferenceNo,
      fullDueDate,
      fullPaidDate,
      fullReferenceNo,
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
    const parseOptionalDate = (value: unknown, fieldName: string): Date | null => {
      if (value === undefined || value === null || value === "") return null;
      if (typeof value !== "string") {
        throw new Error(`'${fieldName}' must be a string`);
      }
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        throw new Error(`'${fieldName}' is not a valid date`);
      }
      return d;
    };

    let parsedDOB: Date | null;
    let parsedHalfDue: Date | null;
    let parsedHalfPaid: Date | null;
    let parsedFullDue: Date | null;
    let parsedFullPaid: Date | null;

    try {
      parsedDOB = parseOptionalDate(dateOfBirth, "dateOfBirth");
      parsedHalfDue = parseOptionalDate(halfDueDate, "halfDueDate");
      parsedHalfPaid = parseOptionalDate(halfPaidDate, "halfPaidDate");
      parsedFullDue = parseOptionalDate(fullDueDate, "fullDueDate");
      parsedFullPaid = parseOptionalDate(fullPaidDate, "fullPaidDate");
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date",
          message: err instanceof Error ? err.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // ---------- Generate student ID ----------
    const studentId = await generateStudentId();

    // ---------- Determine fee from programme ----------
    let totalFee: number | null = null;
    let halfFee: number | null = null;
    let fullFee: number | null = null;

    if (programmeId) {
      const programme = await prisma.programme.findFirst({
        where: {
          OR: [{ id: programmeId.trim() }, { code: programmeId.trim().toUpperCase() }],
        },
      });
      if (programme) {
        totalFee = programme.feeAmount;
        halfFee = programme.feeAmount / 2;
        fullFee = programme.feeAmount;
      }
    }

    // ---------- Create student ----------
    const newStudent = await prisma.user.create({
      data: {
        studentId,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        dateOfBirth: parsedDOB,
        programmeId: programmeId?.trim() || null,
        academicYear: academicYear?.trim() || null,
        status: status?.trim() || "ACTIVE",

        // Fee fields
        totalFee,
        halfFee,
        fullFee,
        adjustedFee: totalFee,

        // Payment fields
        halfDueDate: parsedHalfDue,
        halfPaidDate: parsedHalfPaid,
        halfReferenceNo: halfReferenceNo?.trim() || null,
        fullDueDate: parsedFullDue,
        fullPaidDate: parsedFullPaid,
        fullReferenceNo: fullReferenceNo?.trim() || null,
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
    const students = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },

      include: {
        programme: true,
      },
    });

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

