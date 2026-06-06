// app/dashboard/staff/grading/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

// ===== Type Definitions =====
type Grade = {
  id: string;
  score: number;
  classification: string;
  isPublished: boolean;
  gradedBy: string;
  gradedAt: string;
};

type SubmissionWithGrade = {
  id: string;
  userId: string;
  assessmentId: string;
  fileUrl: string;
  fileName: string;
  isLate: boolean;
  submittedAt: string;
  user: {
    id: string;
    studentId: string;
    name: string;
    programme: string;
    email: string;
  };
  assessment: {
    id: string;
    name: string;
    deadline: string;
  };
  grade: Grade | null;
};

// ===== Helper Functions =====
function getClassificationColor(classification: string): string {
  switch (classification) {
    case "Distinction": return "bg-purple-100 text-purple-800 ring-purple-600/20";
    case "Merit": return "bg-blue-100 text-blue-800 ring-blue-600/20";
    case "Pass": return "bg-green-100 text-green-800 ring-green-600/20";
    case "Fail": return "bg-red-100 text-red-800 ring-red-600/20";
    default: return "bg-gray-100 text-gray-600 ring-gray-400/20";
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-purple-700";
  if (score >= 60) return "text-blue-700";
  if (score >= 40) return "text-green-700";
  return "text-red-700";
}

// ===== Main Component =====
export default function StaffGradingPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssessment, setFilterAssessment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // all, graded, ungraded
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch submissions
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/grades");
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      showToast("err", "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  // Save grade
  const handleSaveGrade = async (submission: SubmissionWithGrade) => {
    const score = parseInt(gradeInput);
    if (isNaN(score) || score < 0 || score > 100) {
      showToast("err", "Please enter a valid score (0-100)");
      return;
    }

    setSavingGrade(submission.id);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: submission.userId,
          assessmentId: submission.assessmentId,
          submissionId: submission.id,
          score,
          gradedBy: "STAFF-001", // Replace with actual staff ID
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submission.id ? { ...s, grade: data.data } : s
          )
        );
        setEditingGrade(null);
        setGradeInput("");
        showToast("ok", "Grade saved successfully");
      } else {
        showToast("err", data.error || "Failed to save grade");
      }
    } catch (error) {
      console.error("Failed to save grade:", error);
      showToast("err", "Failed to save grade");
    } finally {
      setSavingGrade(null);
    }
  };

  // Toggle publish
  const handleTogglePublish = async (grade: Grade) => {
    try {
      const res = await fetch("/api/grades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeId: grade.id,
          isPublished: !grade.isPublished,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.grade?.id === grade.id
              ? { ...s, grade: { ...s.grade, isPublished: !grade.isPublished } }
              : s
          )
        );
        showToast(
          "ok",
          grade.isPublished ? "Results hidden from student" : "Results published to student"
        );
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      showToast("err", "Failed to update publication status");
    }
  };

  // Get unique assessments for filter
  const assessments = useMemo(() => {
    const unique = new Map();
    submissions.forEach((s) => {
      if (!unique.has(s.assessmentId)) {
        unique.set(s.assessmentId, s.assessment);
      }
    });
    return Array.from(unique.values());
  }, [submissions]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchAssessment = filterAssessment === "all" || s.assessmentId === filterAssessment;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "graded" && s.grade) ||
        (filterStatus === "ungraded" && !s.grade);
      const matchSearch =
        !searchQuery ||
        s.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.user.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.user.email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchAssessment && matchStatus && matchSearch;
    });
  }, [submissions, filterAssessment, filterStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.grade).length;
    const published = submissions.filter((s) => s.grade?.isPublished).length;
    return { total, graded, published };
  }, [submissions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-600 mt-3">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2
              ${toast.type === "ok" ? "bg-indigo-600 text-white" : "bg-red-600 text-white"}`}
          >
            <span>{toast.type === "ok" ? "✓" : "✕"}</span>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📝 Student Grading</h1>
          <p className="text-sm text-gray-600 mt-1">
            Grade submissions and control result visibility
          </p>
        </div>
       
        {/* Submissions Table */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            📭 No submissions found
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Student
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Assessment
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                      Submission
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                      Grade
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                      Published
                    </th>
                    <th className="py-3 pl-3 pr-6 text-right text-xs font-semibold uppercase text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {submission.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {submission.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {submission.user.studentId} · {submission.user.programme}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {submission.assessment.name}
                        </p>
                        {submission.isLate && (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 mt-1">
                            Late
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
                        >
                          📄 {submission.fileName}
                        </a>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(submission.submittedAt).toLocaleDateString("en-GB")}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-center">
                        {editingGrade === submission.id ? (
                          <div className="flex items-center gap-2 justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={gradeInput}
                              onChange={(e) => setGradeInput(e.target.value)}
                              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
                              placeholder="0-100"
                            />
                            <button
                              onClick={() => handleSaveGrade(submission)}
                              disabled={savingGrade === submission.id}
                              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {savingGrade === submission.id ? "..." : "Save"}
                            </button>
                          </div>
                        ) : submission.grade ? (
                          <div>
                            <p className={`text-lg font-bold ${getScoreColor(submission.grade.score)}`}>
                              {submission.grade.score}/100
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getClassificationColor(
                                submission.grade.classification
                              )}`}
                            >
                              {submission.grade.classification}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not graded</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-center">
                        {submission.grade ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              submission.grade.isPublished
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {submission.grade.isPublished ? "✓ Published" : "⏸ Hidden"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {submission.grade && (
                            <button
                              onClick={() => handleTogglePublish(submission.grade!)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                submission.grade.isPublished
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-green-100 text-green-800 hover:bg-green-200"
                              }`}
                            >
                              {submission.grade.isPublished ? "Hide" : "Publish"}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingGrade(submission.id);
                              setGradeInput(submission.grade?.score?.toString() || "");
                            }}
                            className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium"
                          >
                            {submission.grade ? "Edit" : "Grade"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}