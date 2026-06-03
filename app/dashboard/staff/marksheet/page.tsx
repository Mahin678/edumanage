// app/dashboard/staff/marksheet/page.tsx
"use client";

import { useMemo, useState } from "react";

// ===== Type Definitions =====
type SubmissionStatus = "Pending" | "Passed" | "Failed";

type Submission = {
  studentId: string;
  studentName: string;
  status: SubmissionStatus;
  submissionLink: string | null;
};

type DetailedStudent = StudentInfo & {
  status: SubmissionStatus | "Not Submitted";
  submissionLink: string | null;
};


type Assignment = {
  id: number;
  name: string;
  createdDate: string;
  deadline: string;
  description: string;
  submissions: Submission[];
};

type AssignmentStats = {
  assignmentId: number;
  assignmentName: string;
  totalStudents: number;
  totalSubmitted: number;
  totalNotSubmitted: number;
  totalPassed: number;
  totalFailed: number;
  totalPending: number;
  passPercentage: number;
  failPercentage: number;
  submitPercentage: number;
};

type StudentInfo = {
  studentId: string;
  studentName: string;
  programme: string;
};

// ===== Dummy Data =====
const initialAssignments: Assignment[] = [
  {
    id: 1,
    name: "Database Normalization Report",
    createdDate: "2025-01-10",
    deadline: "2025-01-25",
    description: "Submit a 5-page report on 1NF, 2NF, 3NF, BCNF.",
    submissions: [
      { studentId: "SMS-2025-0001", studentName: "Rakib Hasan", status: "Passed", submissionLink: "https://drive.google.com/file/d/abc123" },
      { studentId: "SMS-2025-0003", studentName: "Tanvir Ahmed", status: "Passed", submissionLink: "https://tanvir.notion.site/db-report" },
      { studentId: "SMS-2025-0005", studentName: "Mehedi Hasan", status: "Failed", submissionLink: "https://mehedi.hashnode.dev/db" },
    ],
  },
  {
    id: 2,
    name: "React Component Design",
    createdDate: "2025-01-15",
    deadline: "2025-01-30",
    description: "Build a reusable Card component.",
    submissions: [
      { studentId: "SMS-2025-0001", studentName: "Rakib Hasan", status: "Pending", submissionLink: "https://codesandbox.io/s/rakib-card" },
      { studentId: "SMS-2025-0004", studentName: "Nusrat Jahan", status: "Passed", submissionLink: "https://github.com/nusrat/card" },
      { studentId: "SMS-2025-0002", studentName: "Fatema Akter", status: "Passed", submissionLink: "https://github.com/fatema/card" },
    ],
  },
  {
    id: 3,
    name: "JavaScript Closures Explained",
    createdDate: "2025-01-20",
    deadline: "2025-02-05",
    description: "Write a blog on JS Closures.",
    submissions: [
      { studentId: "SMS-2025-0005", studentName: "Mehedi Hasan", status: "Failed", submissionLink: "https://mehedi.hashnode.dev/closures-js" },
      { studentId: "SMS-2025-0003", studentName: "Tanvir Ahmed", status: "Passed", submissionLink: "https://tanvir.dev/closures" },
      { studentId: "SMS-2025-0001", studentName: "Rakib Hasan", status: "Failed", submissionLink: "https://rakib.dev/closures" },
    ],
  },
  {
    id: 4,
    name: "CSS Grid Layout Challenge",
    createdDate: "2025-01-25",
    deadline: "2025-02-10",
    description: "Build a responsive dashboard with CSS Grid.",
    submissions: [
      { studentId: "SMS-2025-0002", studentName: "Fatema Akter", status: "Passed", submissionLink: "https://github.com/fatema/grid-challenge" },
      { studentId: "SMS-2025-0004", studentName: "Nusrat Jahan", status: "Passed", submissionLink: "https://github.com/nusrat/grid" },
    ],
  },
  {
    id: 5,
    name: "API Integration Project",
    createdDate: "2025-01-28",
    deadline: "2025-02-15",
    description: "Integrate a public API with proper error handling.",
    submissions: [],
  },
];

// All students
const allStudents: StudentInfo[] = [
  { studentId: "SMS-2025-0001", studentName: "Rakib Hasan", programme: "BSc Computer Science" },
  { studentId: "SMS-2025-0002", studentName: "Fatema Akter", programme: "BA Business Admin" },
  { studentId: "SMS-2025-0003", studentName: "Tanvir Ahmed", programme: "BSc Computer Science" },
  { studentId: "SMS-2025-0004", studentName: "Nusrat Jahan", programme: "BA Business Admin" },
  { studentId: "SMS-2025-0005", studentName: "Mehedi Hasan", programme: "BSc Computer Science" },
];

// ===== Calculate stats for an assignment =====
function calculateAssignmentStats(
  assignment: Assignment,
  totalStudents: number
): AssignmentStats {
  const submitted = assignment.submissions.length;
  const notSubmitted = totalStudents - submitted;
  const passed = assignment.submissions.filter((s) => s.status === "Passed").length;
  const failed = assignment.submissions.filter((s) => s.status === "Failed").length;
  const pending = assignment.submissions.filter((s) => s.status === "Pending").length;

  return {
    assignmentId: assignment.id,
    assignmentName: assignment.name,
    totalStudents,
    totalSubmitted: submitted,
    totalNotSubmitted: notSubmitted,
    totalPassed: passed,
    totalFailed: failed,
    totalPending: pending,
    passPercentage: submitted > 0 ? Math.round((passed / submitted) * 100) : 0,
    failPercentage: submitted > 0 ? Math.round((failed / submitted) * 100) : 0,
    submitPercentage: totalStudents > 0 ? Math.round((submitted / totalStudents) * 100) : 0,
  };
}

// ===== Main Component =====
export default function MarksheetPage() {
  const [assignments] = useState<Assignment[]>(initialAssignments);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary");

  // Calculate stats for all assignments
  const allStats: AssignmentStats[] = useMemo(
    () => assignments.map((a) => calculateAssignmentStats(a, allStudents.length)),
    [assignments]
  );

  // Filter stats based on selection
  const filteredStats = useMemo(() => {
    if (selectedAssignmentId === "all") return allStats;
    return allStats.filter((s) => s.assignmentId === Number(selectedAssignmentId));
  }, [allStats, selectedAssignmentId]);

  // Overall totals
  const overallStats = useMemo(() => {
    return allStats.reduce(
      (acc, s) => ({
        totalAssignments: allStats.length,
        totalSubmissions: acc.totalSubmissions + s.totalSubmitted,
        totalPassed: acc.totalPassed + s.totalPassed,
        totalFailed: acc.totalFailed + s.totalFailed,
        totalPending: acc.totalPending + s.totalPending,
        maxPossible: acc.maxPossible + s.totalStudents,
      }),
      { totalAssignments: 0, totalSubmissions: 0, totalPassed: 0, totalFailed: 0, totalPending: 0, maxPossible: 0 }
    );
  }, [allStats]);

  // Get detailed list of students for selected assignment
  const getDetailedStudents = (assignmentId: string): DetailedStudent[] => {
    if (assignmentId === "all") return [];
    const assignment = assignments.find((a) => a.id === Number(assignmentId));
    if (!assignment) return [];

    return allStudents.map((student) => {
      const sub = assignment.submissions.find((s) => s.studentId === student.studentId);
      return {
        ...student,
        status: sub?.status ?? "Not Submitted",
        submissionLink: sub?.submissionLink ?? null,
      };
    });
  };

  const detailedStudents = getDetailedStudents(selectedAssignmentId);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ===== Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Marksheet Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Detailed pass/fail/submission statistics for all assignments
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                viewMode === "summary"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              📈 Summary
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                viewMode === "detailed"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              📋 Detailed
            </button>
          </div>
        </div>

        {/* ===== Overall Stats Cards ===== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-xl">
                📚
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Assignments</p>
                <p className="text-xl font-bold text-gray-900">{overallStats.totalAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                📤
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Total Submitted</p>
                <p className="text-xl font-bold text-blue-600">{overallStats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
                ✅
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Total Passed</p>
                <p className="text-xl font-bold text-green-600">{overallStats.totalPassed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-xl">
                ❌
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Total Failed</p>
                <p className="text-xl font-bold text-red-600">{overallStats.totalFailed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center text-xl">
                ⏳
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Total Pending</p>
                <p className="text-xl font-bold text-yellow-600">{overallStats.totalPending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Filter ===== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🎯 Filter by Assignment
          </label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="block w-full md:w-96 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">📋 All Assignments (Overview)</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} — {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* ===== Summary View (All Assignments) ===== */}
        {viewMode === "summary" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                📊 Assignment-wise Statistics
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Pass, fail, and submission counts for each assignment
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Assignment
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Total Students
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Submitted
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Not Submitted
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Passed
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Failed
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Pending
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Pass Rate
                    </th>
                    <th className="py-3 pl-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Visual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStats.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        📭 No data available
                      </td>
                    </tr>
                  ) : (
                    filteredStats.map((stat) => (
                      <tr key={stat.assignmentId} className="hover:bg-gray-50">
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              #{stat.assignmentId}
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {stat.assignmentName}
                            </p>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800 ring-1 ring-inset ring-gray-500/20">
                            👥 {stat.totalStudents}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
                            📤 {stat.totalSubmitted}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ({stat.submitPercentage}%)
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-500/20">
                            ❌ {stat.totalNotSubmitted}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-inset ring-green-600/20">
                            ✅ {stat.totalPassed}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-600/20">
                            ❌ {stat.totalFailed}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                            ⏳ {stat.totalPending}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold ${
                                stat.passPercentage >= 70
                                  ? "text-green-600"
                                  : stat.passPercentage >= 40
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {stat.passPercentage}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 pl-3 pr-6">
                          {/* Progress bar */}
                          <div className="w-32">
                            <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="bg-green-500"
                                style={{ width: `${stat.passPercentage}%` }}
                              />
                              <div
                                className="bg-red-500"
                                style={{
                                  width: `${
                                    stat.totalSubmitted > 0
                                      ? (stat.totalFailed / stat.totalSubmitted) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                              <div
                                className="bg-yellow-500"
                                style={{
                                  width: `${
                                    stat.totalSubmitted > 0
                                      ? (stat.totalPending / stat.totalSubmitted) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== Detailed View (Per Assignment) ===== */}
        {viewMode === "detailed" && (
          <div className="space-y-4">
            {selectedAssignmentId === "all" ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                📌 Please select a specific assignment from the dropdown to see detailed student list.
              </div>
            ) : (
              <>
                {detailedStudents.length > 0 && (
                  <DetailedAssignmentView
                    students={detailedStudents}
                    assignment={assignments.find(
                      (a) => a.id === Number(selectedAssignmentId)
                    )!}
                  />
                )}
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-500">
          💡 Switch between Summary and Detailed view using the toggle buttons.
        </p>
      </div>
    </div>
  );
}

// ===== Detailed View Sub-Component =====
function DetailedAssignmentView({
  assignment,
  students,
}: {
  assignment: Assignment;
  students: DetailedStudent[];
}) {
  const totalStudents = students.length;
  const submitted = students.filter((s) => s.status !== "Not Submitted").length;
  const passed = students.filter((s) => s.status === "Passed").length;
  const failed = students.filter((s) => s.status === "Failed").length;
  const pending = students.filter((s) => s.status === "Pending").length;
  const notSubmitted = students.filter((s) => s.status === "Not Submitted").length;
  const passRate = submitted > 0 ? Math.round((passed / submitted) * 100) : 0;

  return (
    <>
      {/* Top Stats Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold">📚 {assignment.name}</h2>
        <p className="text-sm text-indigo-100 mt-1">
          {assignment.description}
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-indigo-200 uppercase tracking-wide">Submitted</p>
            <p className="text-2xl font-bold mt-1">
              {submitted}/{totalStudents}
            </p>
          </div>
          <div>
            <p className="text-xs text-indigo-200 uppercase tracking-wide">Passed</p>
            <p className="text-2xl font-bold mt-1 text-green-200">{passed}</p>
          </div>
          <div>
            <p className="text-xs text-indigo-200 uppercase tracking-wide">Failed</p>
            <p className="text-2xl font-bold mt-1 text-red-200">{failed}</p>
          </div>
          <div>
            <p className="text-xs text-indigo-200 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold mt-1 text-yellow-200">{pending}</p>
          </div>
          <div>
            <p className="text-xs text-indigo-200 uppercase tracking-wide">Pass Rate</p>
            <p className="text-2xl font-bold mt-1">{passRate}%</p>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            👥 Student-wise Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Student ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Programme</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                <th className="py-3 pl-3 pr-6 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-3 pl-6 pr-3 text-sm font-medium text-gray-500">
                    {index + 1}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm font-mono font-semibold text-indigo-600">
                    {student.studentId}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-900">
                    {student.studentName}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {student.programme}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        student.status === "Passed"
                          ? "bg-green-100 text-green-800 ring-green-600/20"
                          : student.status === "Failed"
                          ? "bg-red-100 text-red-800 ring-red-600/20"
                          : student.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800 ring-yellow-600/20"
                          : "bg-gray-100 text-gray-600 ring-gray-400/20"
                      }`}
                    >
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                      {student.status}
                    </span>
                  </td>
                  <td className="py-3 pl-3 pr-6">
                    {student.submissionLink ? (
                      <a
                        href={student.submissionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline truncate max-w-[200px] inline-block"
                      >
                        🔗 View
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
