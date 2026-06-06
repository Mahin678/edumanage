import { Prisma } from "@/app/generated/prisma/browser";
import { prisma } from "@/app/prisma";
import { NextRequest, NextResponse } from "next/server";

type PrismaError = {
  code?: string;
  meta?: Record<string, unknown>;
  message?: string;
};

function isPrismaError(error: unknown): error is PrismaError {
  return typeof error === "object" && error !== null && "code" in error;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      halfDueDate,
      halfPaidDate,
      halfReferenceNo,
      fullDueDate,
      fullPaidDate,
      fullReferenceNo,
    } = body;

    // ---------- Date parsing ----------
    const parseDate = (value: unknown, fieldName: string): Date | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null || value === "") return null;
      if (typeof value !== "string") {
        throw new Error(`'${fieldName}' must be a string`);
      }
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        throw new Error(`'${fieldName}' is not a valid date`);
      }
      return d;
    };

    let parsedHalfDue: Date | null | undefined;
    let parsedHalfPaid: Date | null | undefined;
    let parsedFullDue: Date | null | undefined;
    let parsedFullPaid: Date | null | undefined;

    try {
      parsedHalfDue = parseDate(halfDueDate, "halfDueDate");
      parsedHalfPaid = parseDate(halfPaidDate, "halfPaidDate");
      parsedFullDue = parseDate(fullDueDate, "fullDueDate");
      parsedFullPaid = parseDate(fullPaidDate, "fullPaidDate");
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

    // ---------- Build update payload ----------
    const data: Prisma.UserUpdateInput = {};

    if (parsedHalfDue !== undefined) data.halfDueDate = parsedHalfDue;
    if (parsedHalfPaid !== undefined) data.halfPaidDate = parsedHalfPaid;
    if (halfReferenceNo !== undefined) data.halfReferenceNo = halfReferenceNo?.trim() || null;
    if (parsedFullDue !== undefined) data.fullDueDate = parsedFullDue;
    if (parsedFullPaid !== undefined) data.fullPaidDate = parsedFullPaid;
    if (fullReferenceNo !== undefined) data.fullReferenceNo = fullReferenceNo?.trim() || null;

    // ✅ Match by studentId (the human-readable ID like "STU-2026-0017")
    const updatedStudent = await prisma.user.update({
      where: { studentId: id },
      data,
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedStudent,
        message: "Student updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    // console.error(`[PATCH /api/students/${id}] Error:`, error);
    if (isPrismaError(error) && error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update student",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
