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

// GET single programme
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programme = await prisma.programme.findUnique({ where: { id } });

    if (!programme) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: programme });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

// PATCH update programme
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, feeAmount } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim().toUpperCase();
    if (code) updateData.code = code.trim().toUpperCase();
    if (feeAmount !== undefined) updateData.feeAmount = parseFloat(feeAmount.toString());

    const updated = await prisma.programme.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (isPrismaError(error) && error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

// DELETE programme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.programme.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}