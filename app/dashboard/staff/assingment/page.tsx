// app/dashboard/staff/student-assignments/page.tsx
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

type Assignment = {
  id: number;
  name: string;
  createdDate: string;
  deadline: string;
  description: string;
  submissions: Submission[];
};

type StudentSummary = {
  studentId: string;
  studentName: string;
  programme: string;
  email: string;
  submissions: {
    assignmentId: number;
    assignmentName: string;
    submitted: boolean;
    submissionLink: string | null;
    status: SubmissionStatus | "Not Submitted";
    deadline: string;
  }[];
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
      {
        studentId: "SMS-2025-0001",
        studentName: "Rakib Hasan",
        status: "Passed",
        submissionLink: "https://drive.google.com/file/d/abc123",
      },
      {
        studentId: "SMS-2025-0003",
        studentName: "Tanvir Ahmed",
        status: "Passed",
        submissionLink: "https://tanvir.notion.site/db-report",
      },
    ],
  },
  {
    id: 2,
    name: "React Component Design",
    createdDate: "2025-01-15",
    deadline: "2025-01-30",
    description: "Build a reusable Card component.",
    submissions: [
      {
        studentId: "SMS-2025-0001",
        studentName: "Rakib Hasan",
        status: "Pending",
        submissionLink: "https://codesandbox.io/s/rakib-card",
      },
      {
        studentId: "SMS-2025-0004",
        studentName: "Nusrat Jahan",
        status: "Passed",
        submissionLink: "https://github.com/nusrat/card",
      },
    ],
  },
  {
    id: 3,
    name: "JavaScript Closures Explained",
    createdDate: "2025-01-20",
    deadline: "2025-02-05",
    description: "Write a blog on JS Closures.",
    submissions: [
      {
        studentId: "SMS-2025-0005",
        studentName: "Mehedi Hasan",
        status: "Failed",
        submissionLink: "https://mehedi.hashnode.dev/closures-js",
      },
      {
        studentId: "SMS-2025-0003",
        studentName: "Tanvir Ahmed",
        status: "Passed",
        submissionLink: "https://tanvir.dev/closures",
      },
    ],
  },
  {
    id: 4,
    name: "CSS Grid Layout Challenge",
    createdDate: "2025-01-25",
    deadline: "2025-02-10",
    description: "Build a responsive dashboard with CSS Grid.",
    submissions: [
      {
        studentId: "SMS-2025-0002",
        studentName: "Fatema Akter",
        status: "Passed",
        submissionLink: "https://github.com/fatema/grid-challenge",
      },
    ],
  },
];

// All students
const allStudents = [
  { studentId: "SMS-2025-0001", studentName: "Rakib Hasan", programme: "BSc Computer Science", email: "rakib@uni.edu" },
  { studentId: "SMS-2025-0002", studentName: "Fatema Akter", programme: "BA Business Admin", email: "fatema@uni.edu" },
  { studentId: "SMS-2025-0003", studentName: "Tanvir Ahmed", programme: "BSc Computer Science", email: "tanvir@uni.edu" },
  { studentId: "SMS-2025-0004", studentName: "Nusrat Jahan", programme: "BA Business Admin", email: "nusrat@uni.edu" },
  { studentId: "SMS-2025-0005", studentName: "Mehedi Hasan", programme: "BSc Computer Science", email: "mehedi@uni.edu" },
];

// ===== Build Student Summary =====
function buildStudentSummary(
  assignments: Assignment[],
  students: typeof allStudents
): StudentSummary[] {
  return students.map((student) => {
    const studentSubmissions = assignments.map((assignment) => {
      const sub = assignment.submissions.find((s) => s.studentId === student.studentId);
      return {
        assignmentId: assignment.id,
        assignmentName: assignment.name,
        submitted: sub !== undefined,
        submissionLink: sub?.submissionLink ?? null,
        status: (sub?.status ?? "Not Submitted") as SubmissionStatus | "Not Submitted",
        deadline: assignment.deadline,
      };
    });

    return {
      studentId: student.studentId,
      studentName: student.studentName,
      programme: student.programme,
      email: student.email,
      submissions: studentSubmissions,
    };
  });
}

// Get status badge
function getStatusBadgeClass(status: SubmissionStatus | "Not Submitted"): string {
  if (status === "Passed") return "bg-green-100 text-green-800 ring-green-600/20";
  if (status === "Failed") return "bg-red-100 text-red-800 ring-red-600/20";
  if (status === "Pending") return "bg-yellow-100 text-yellow-800 ring-yellow-600/20";
  return "bg-gray-100 text-gray-600 ring-gray-400/20";
}

// ===== Main Component =====
export default function StudentAssignmentsPage() {
  // ✅ FIX: assignments কে state এ রাখুন যাতে update হয়
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  // Build student summary (এখন assignments state change হলে re-compute হবে)
  const allStudentSummaries = useMemo(
    () => buildStudentSummary(assignments, allStudents),
    [assignments] // ✅ assignments dependency
  );

  // Filter
  const filteredSummaries = useMemo(() => {
    let result = allStudentSummaries;

    if (selectedAssignmentId !== "all") {
      const assignmentId = Number(selectedAssignmentId);
      result = result
        .map((s) => ({
          ...s,
          submissions: s.submissions.filter((sub) => sub.assignmentId === assignmentId),
        }))
        .filter((s) => s.submissions.length > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allStudentSummaries, selectedAssignmentId, searchQuery]);

  // ✅ FIX: Status update handler — এটা এখন state change করবে
  const handleStatusUpdate = (
    studentId: string,
    assignmentId: number,
    newStatus: SubmissionStatus
  ): void => {
    const cellKey = `${studentId}-${assignmentId}`;
    setUpdatingCell(cellKey);

    // Simulate API call delay
    setTimeout(() => {
      setAssignments((prev) =>
        prev.map((assignment) => {
          if (assignment.id !== assignmentId) return assignment;

          // Check if student exists in this assignment
          const existingIndex = assignment.submissions.findIndex(
            (s) => s.studentId === studentId
          );

          if (existingIndex >= 0) {
            // ✅ Update existing submission's status
            const updatedSubmissions = assignment.submissions.map((s, idx) =>
              idx === existingIndex ? { ...s, status: newStatus } : s
            );
            return { ...assignment, submissions: updatedSubmissions };
          } else {
            // ✅ Student didn't submit yet — but if we mark them Passed/Failed,
            // we add them with a placeholder link
            if (newStatus !== "Pending") {
              const student = allStudents.find((s) => s.studentId === studentId);
              return {
                ...assignment,
                submissions: [
                  ...assignment.submissions,
                  {
                    studentId,
                    studentName: student?.studentName ?? "Unknown",
                    status: newStatus,
                    submissionLink: null,
                  },
                ],
              };
            }
            return assignment;
          }
        })
      );

      setUpdatingCell(null);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            👥 Student Assignment List
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View all students and update their assignment submission status
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                📚 Filter by Assignment
              </label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">📋 All Assignments</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} — {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                🔍 Search Student
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or email..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {filteredSummaries.length} student{filteredSummaries.length !== 1 && "s"} found
            </span>
            {selectedAssignmentId !== "all" && (
              <button
                onClick={() => setSelectedAssignmentId("all")}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Student Cards */}
        {filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            📭 No students found matching your filters
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSummaries.map((student) => (
              <div
                key={student.studentId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Student Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {student.studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {student.studentName}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-0.5">
                          <span>🆔 {student.studentId}</span>
                          <span>📚 {student.programme}</span>
                          <span>📧 {student.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-inset ring-green-600/20">
                        ✅ {student.submissions.filter((s) => s.submitted).length} / {student.submissions.length} Submitted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2.5 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">#</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Assignment Name</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Deadline</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Submission Status</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Submission Link</th>
                        <th className="py-2.5 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {student.submissions.map((sub, index) => (
                        <tr key={sub.assignmentId} className="hover:bg-gray-50">
                          
                          <td className="whitespace-nowrap py-3 pl-6 pr-3 text-sm font-medium text-gray-500">
                            {index + 1}
                          </td>

                          <td className="px-3 py-3 text-sm">
                            <p className="font-medium text-gray-900">{sub.assignmentName}</p>
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">
                            {new Date(sub.deadline).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>

                          <td className="whitespace-nowrap px-3 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusBadgeClass(
                                sub.status
                              )}`}
                            >
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                              {sub.status}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            {sub.submissionLink ? (
                              <a
                                href={sub.submissionLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline truncate max-w-[200px]"
                              >
                                🔗 {sub.submissionLink.length > 30
                                  ? sub.submissionLink.substring(0, 30) + "..."
                                  : sub.submissionLink}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 italic">—</span>
                            )}
                          </td>

                          {/* ✅ Action cell — dropdown যেটা state change করে */}
                          <td className="py-3 pl-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {updatingCell === `${student.studentId}-${sub.assignmentId}` ? (
                                <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Saving...
                                </div>
                              ) : sub.submitted ? (
                                <select
                                  value={sub.status}
                                  onChange={(e) =>
                                    handleStatusUpdate(
                                      student.studentId,
                                      sub.assignmentId,
                                      e.target.value as SubmissionStatus
                                    )
                                  }
                                  className={`block rounded-md border px-2 py-1 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${getStatusBadgeClass(
                                    sub.status
                                  )}`}
                                >
                                  <option value="Pending">⏳ Pending</option>
                                  <option value="Passed">✅ Passed</option>
                                  <option value="Failed">❌ Failed</option>
                                </select>
                              ) : (
                                <select
                                  value="Not Submitted"
                                  onChange={(e) =>
                                    handleStatusUpdate(
                                      student.studentId,
                                      sub.assignmentId,
                                      e.target.value as SubmissionStatus
                                    )
                                  }
                                  className="block rounded-md border bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                  <option value="Not Submitted" disabled>
                                    Not Submitted
                                  </option>
                                  <option value="Pending">⏳ Mark Pending</option>
                                  <option value="Passed">✅ Mark Passed</option>
                                  <option value="Failed">❌ Mark Failed</option>
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-500">
          💡 Dropdown থেকে status change করুন — data instantly update হবে।
        </p>
      </div>
    </div>
  );
}
