import { prisma } from "@/app/prisma"; // adjust this import to match your project
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const programmes = await prisma.programme.findMany()

    if (programmes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No programmes found. Create programmes first." },
        { status: 400 }
      )
    }

    const students = await prisma.user.findMany({
      where: {
        status: "Enrolled",
        programmeId: { not: null },
      },
    })

    let updatedCount = 0

    for (const student of students) {
      if (!student.programmeId) continue

      const programme = programmes.find(
        (p) => p.id === student.programmeId || p.code === student.programmeId
      )

      if (programme) {
        await prisma.user.update({
          where: { id: student.id },
          data: {
            totalFee:    programme.feeAmount,
            halfFee:     programme.feeAmount / 2,
            fullFee:     programme.feeAmount,
            adjustedFee: programme.feeAmount,
          },
        })
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fees assigned to ${updatedCount} students`,
      count: updatedCount,
    })
  } catch (error) {
    console.error("[POST /api/fees/assign-all] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to assign fees" },
      { status: 500 }
    )
  }
}