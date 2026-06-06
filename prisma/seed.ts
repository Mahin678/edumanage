import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});


const prisma = new PrismaClient({ adapter });

async function main() {
  // Programmes
  const cs = await prisma.programme.upsert({
    where: { code: "CS101" },
    update: {},
    create: {
      name: "BSc Computer Science",
      code: "CS101",
      feeAmount: 50000,
    },
  });

  const bba = await prisma.programme.upsert({
    where: { code: "BBA101" },
    update: {},
    create: {
      name: "BBA Business Administration",
      code: "BBA101",
      feeAmount: 45000,
    },
  });

  // Students
  const students = await Promise.all([
    prisma.user.create({
      data: {
        studentId: "STU-001",
        name: "Rahim Uddin",
        email: "rahim@example.com",
        programmeId: cs.id,
        academicYear: "2026",
        status: "ACTIVE",
        totalFee: 50000,
        halfFee: 25000,
        fullFee: 50000,
        adjustedFee: 50000,
      },
    }),

    prisma.user.create({
      data: {
        studentId: "STU-002",
        name: "Karim Hasan",
        email: "karim@example.com",
        programmeId: cs.id,
        academicYear: "2026",
        status: "ACTIVE",
        totalFee: 50000,
        adjustedFee: 50000,
      },
    }),

    prisma.user.create({
      data: {
        studentId: "STU-003",
        name: "Ayesha Akter",
        email: "ayesha@example.com",
        programmeId: bba.id,
        academicYear: "2026",
        status: "ACTIVE",
        totalFee: 45000,
        adjustedFee: 45000,
      },
    }),

    prisma.user.create({
      data: {
        studentId: "STU-004",
        name: "Nabila Islam",
        email: "nabila@example.com",
        programmeId: bba.id,
        academicYear: "2026",
        status: "DEFERRED",
        totalFee: 45000,
        adjustedFee: 45000,
      },
    }),

    prisma.user.create({
      data: {
        studentId: "STU-005",
        name: "Fahim Ahmed",
        email: "fahim@example.com",
        programmeId: cs.id,
        academicYear: "2026",
        status: "COMPLETED",
        totalFee: 50000,
        adjustedFee: 50000,
      },
    }),
  ]);

  // Payments
  await Promise.all(
    students.map((student) =>
      prisma.payment.create({
        data: {
          studentId: student.id,
          studentName: student.name,
          email: student.email,
          programmeId: student.programmeId,
          halfDueDate: new Date("2026-06-30"),
          halfPaidDate: new Date("2026-06-15"),
          halfReferenceNo: `HALF-${student.studentId}`,
          fullDueDate: new Date("2026-12-31"),
        },
      })
    )
  );

  // Assessments
  const assessment1 = await prisma.assessment.create({
    data: {
      name: "Programming Fundamentals",
      description: "Semester Assignment",
      deadline: new Date("2026-07-15"),
    },
  });

  const assessment2 = await prisma.assessment.create({
    data: {
      name: "Database Systems",
      description: "Database Coursework",
      deadline: new Date("2026-08-15"),
    },
  });

  // Submissions
  const submission1 = await prisma.submission.create({
    data: {
      userId: students[0].id,
      assessmentId: assessment1.id,
      fileUrl: "/uploads/rahim-programming.pdf",
      fileName: "rahim-programming.pdf",
      submittedAt: new Date(),
      status: "Submitted",
    },
  });

  const submission2 = await prisma.submission.create({
    data: {
      userId: students[2].id,
      assessmentId: assessment2.id,
      fileUrl: "/uploads/ayesha-database.pdf",
      fileName: "ayesha-database.pdf",
      submittedAt: new Date(),
      status: "Submitted",
    },
  });

  // Grades
  await prisma.grade.createMany({
    data: [
      {
        userId: students[0].id,
        assessmentId: assessment1.id,
        submissionId: submission1.id,
        score: 88,
        classification: "Distinction",
        isPublished: true,
        gradedBy: "STAFF-001",
      },
      {
        userId: students[2].id,
        assessmentId: assessment2.id,
        submissionId: submission2.id,
        score: 75,
        classification: "Merit",
        isPublished: true,
        gradedBy: "STAFF-001",
      },
    ],
  });

  console.log("✅ Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });