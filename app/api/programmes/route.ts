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

// GET all programmes
export async function GET() {
  try {
    const programmes = await prisma.programme.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: programmes,
      count: programmes.length,
    });
  } catch (error) {
    console.error("[GET /api/programmes] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch programmes" },
      { status: 500 }
    );
  }
}

// POST create new programme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, feeAmount } = body;

    if (!name || !code || feeAmount === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, code, feeAmount" },
        { status: 400 }
      );
    }

    const programme = await prisma.programme.create({
      data: {
        name: name.trim().toUpperCase(),
        code: code.trim().toUpperCase(),
        feeAmount: parseFloat(feeAmount.toString()),
      },
    });

    return NextResponse.json(
      { success: true, data: programme, message: "Programme created" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/programmes] Error:", error);
    if (isPrismaError(error) && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Programme already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create programme" },
      { status: 500 }
    );
  }
}