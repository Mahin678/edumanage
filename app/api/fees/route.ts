import { prisma } from "@/app/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/fees - Assign fee to student based on programme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, customFeeAmount } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: "studentId required" }, { status: 400 });
    }

    const student = await prisma.user.findFirst({
      where: { OR: [{ id: studentId }, { studentId: studentId }] },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    let feeAmount = customFeeAmount;

    // If no custom fee, get from programme
    if (!feeAmount && student.programmeId) {
      const programme = await prisma.programme.findFirst({
        where: { OR: [{ id: student.programmeId }, { code: student.programmeId }] },
      });
      if (programme) feeAmount = programme.feeAmount;
    }

    if (!feeAmount) {
      return NextResponse.json({ success: false, error: "No fee amount found" }, { status: 400 });
    }

    const halfFee = Number(feeAmount) / 2;

    const updated = await prisma.user.update({
      where: { id: student.id },
      data: {
        totalFee: feeAmount,
        halfFee,
        fullFee: feeAmount,
        adjustedFee: feeAmount,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Fee assigned: Total=${feeAmount}, Half=${halfFee}`,
    });
  } catch (error) {
    console.error("[POST /api/fees] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to assign fee" }, { status: 500 });
  }
}

// PATCH /api/fees - Adjust fee after payment
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, adjustedFeeAmount } = body;

    if (!studentId || adjustedFeeAmount === undefined) {
      return NextResponse.json(
        { success: false, error: "studentId and adjustedFeeAmount required" },
        { status: 400 }
      );
    }

    const student = await prisma.user.findFirst({
      where: { OR: [{ id: studentId }, { studentId: studentId }] },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: student.id },
      data: { adjustedFee: parseFloat(adjustedFeeAmount.toString()) },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Fee adjusted to ${adjustedFeeAmount}`,
    });
  } catch (error) {
    console.error("[PATCH /api/fees] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to adjust fee" }, { status: 500 });
  }
}