// app/dashboard/staff/assignments/page.tsx
"use client";

import { useState } from "react";

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

type DeadlineInfo = {
  label: string;
  class: string;
};

type ExpandedRows = Record<number, boolean>;

// ===== Dummy Data (with submissions kept for type safety) =====
const initialAssignments: Assignment[] = [
  {
    id: 1,
    name: "Database Normalization Report",
    createdDate: "2025-01-10",
    deadline: "2025-01-25",
    description:
      "Submit a 5-page report on 1NF, 2NF, 3NF, BCNF with examples. Use this reference: https://www.geeksforgeeks.org/normal-forms-in-dbms/",
    submissions: [],
  },
  {
    id: 2,
    name: "React Component Design",
    createdDate: "2025-01-15",
    deadline: "2025-01-30",
    description:
      "Build a reusable Card component with props. Reference: https://react.dev/learn/passing-props-to-components",
    submissions: [],
  },
  {
    id: 3,
    name: "JavaScript Closures Explained",
    createdDate: "2025-01-20",
    deadline: "2025-02-05",
    description:
      "Write a blog-style explanation with 3 code examples. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
    submissions: [],
  },
];

// ===== Helper Functions =====
function getDeadlineStatus(_createdDate: string, deadline: string): DeadlineInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);

  if (due < today) {
    return { label: "Overdue", class: "bg-red-100 text-red-800 ring-red-600/20" };
  }
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 3) {
    return { label: `${diffDays}d left`, class: "bg-yellow-100 text-yellow-800 ring-yellow-600/20" };
  }
  return { label: `${diffDays}d left`, class: "bg-green-100 text-green-800 ring-green-600/20" };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ===== Description Component =====
function DescriptionWithLinks({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <p className="text-sm text-gray-700 leading-relaxed">
      {parts.map((part, index) => {
        const isUrl = urlRegex.test(part);
        if (isUrl) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 underline break-all"
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}

// ===== Main Component =====
export default function AssignmentsPage() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    name: "",
    createdDate: new Date().toISOString().split("T")[0],
    deadline: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});

  const toggleRow = (id: number): void => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenModal = (): void => {
    setShowNewModal(true);
    setNewAssignment({
      name: "",
      createdDate: new Date().toISOString().split("T")[0],
      deadline: "",
      description: "",
    });
    setFormErrors({});
  };

  const handleCloseModal = (): void => {
    setShowNewModal(false);
  };

  const handleNewAssignmentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setNewAssignment((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateNewAssignment = (): boolean => {
    const errors: Record<string, string> = {};
    if (!newAssignment.name.trim()) errors.name = "Assignment name is required";
    if (!newAssignment.deadline) errors.deadline = "Deadline is required";
    if (newAssignment.deadline && newAssignment.deadline < newAssignment.createdDate) {
      errors.deadline = "Deadline must be after created date";
    }
    if (!newAssignment.description.trim()) errors.description = "Description is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAssignment = (): void => {
    if (!validateNewAssignment()) return;

    const newId =
      assignments.length > 0 ? Math.max(...assignments.map((a) => a.id)) + 1 : 1;

    const created: Assignment = {
      id: newId,
      name: newAssignment.name,
      createdDate: newAssignment.createdDate,
      deadline: newAssignment.deadline,
      description: newAssignment.description,
      submissions: [],
    };

    setAssignments((prev) => [created, ...prev]);
    setShowNewModal(false);
    setExpandedRows((prev) => ({ ...prev, [newId]: true }));
    alert(`✅ Assignment "${created.name}" created successfully!`);
  };

  // Stats (submission count removed)
  const totalAssignments = assignments.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 Assignments & Assessments</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage assignments, deadlines & descriptions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              + New Assesment
            </button>
          </div>
        </div>

        {/* Stats - Simplified (no submission stats) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-600">Total Assessments</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{totalAssignments}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-600">Active</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {assignments.filter((a) => getDeadlineStatus(a.createdDate, a.deadline).label !== "Overdue").length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-600">Overdue</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {assignments.filter((a) => getDeadlineStatus(a.createdDate, a.deadline).label === "Overdue").length}
            </p>
          </div>
        </div>

        {/* Assignment List */}
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
              📭 No assignments yet. Click &quot;New Assignment&quot; to create one.
            </div>
          ) : (
            assignments.map((assignment) => {
              const deadlineInfo = getDeadlineStatus(assignment.createdDate, assignment.deadline);
              const isExpanded = expandedRows[assignment.id];

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Main Row */}
                  <div
                    onClick={() => toggleRow(assignment.id)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors items-center"
                  >
                    <div className="col-span-12 md:col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          #{assignment.id}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {assignment.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Created {formatDate(assignment.createdDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide md:hidden">Created</p>
                      <p className="text-sm text-gray-700">📅 {formatDate(assignment.createdDate)}</p>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide md:hidden">Deadline</p>
                      <p className="text-sm text-gray-700">⏰ {formatDate(assignment.deadline)}</p>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${deadlineInfo.class}`}
                      >
                        {deadlineInfo.label}
                      </span>
                    </div>

                    <div className="col-span-6 md:col-span-2 flex justify-end">
                      <button className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        {isExpanded ? "Hide" : "View"} Details
                        <svg
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Section - Only Description (No Submissions) */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50/50">
                      <div className="px-6 py-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                          📝 Description
                        </h4>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <DescriptionWithLinks text={assignment.description} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <p className="text-center text-xs text-gray-500">
          💡 Click on any assignment row to view description and links.
        </p>
      </div>

      {/* New Assignment Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-200">Create New</p>
                <h3 className="text-lg font-semibold text-white">📚 New Assignment</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-lg bg-white/20 hover:bg-white/30 p-1.5 text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Assignment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newAssignment.name}
                  onChange={handleNewAssignmentChange}
                  placeholder="e.g., React Hooks Deep Dive"
                  className={`block w-full rounded-lg border ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  } bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-600">⚠️ {formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Created Date
                  </label>
                  <input
                    type="date"
                    name="createdDate"
                    value={newAssignment.createdDate}
                    onChange={handleNewAssignmentChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={newAssignment.deadline}
                    onChange={handleNewAssignmentChange}
                    className={`block w-full rounded-lg border ${
                      formErrors.deadline ? "border-red-300" : "border-gray-300"
                    } bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                  />
                  {formErrors.deadline && <p className="mt-1 text-xs text-red-600">⚠️ {formErrors.deadline}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={newAssignment.description}
                  onChange={handleNewAssignmentChange}
                  rows={4}
                  placeholder="Describe the assignment requirements... (You can paste links)"
                  className={`block w-full rounded-lg border ${
                    formErrors.description ? "border-red-300" : "border-gray-300"
                  } bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none`}
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-red-600">⚠️ {formErrors.description}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                ✅ Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
