"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubmissionStatus = "Pending" | "Passed" | "Failed";

type MySubmission = {
  id: string;
  assessmentId: number;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  isLate: boolean;
  status: SubmissionStatus;
};

type Assessment = {
  id: number;
  name: string;
  createdDate: string;
  deadline: string;
  description: string;
};

// ─── New Types for Results ────────────────────────────────────────────────────
type GradeResult = {
  id: string;
  score: number;
  classification: string;
  isPublished: boolean;
  gradedAt: string;
  assessment: {
    id: number;
    name: string;
    deadline: string;
  };
  submission: {
    fileUrl: string;
    fileName: string;
    isLate: boolean;
    submittedAt: string;
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDeadlinePassed(deadline: string): boolean {
  return new Date(deadline) < new Date();
}

function daysUntil(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getClassificationColor(classification: string): string {
  switch (classification) {
    case "Distinction": return "bg-purple-100 text-purple-800 border-purple-200";
    case "Merit": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Pass": return "bg-green-100 text-green-800 border-green-200";
    case "Fail": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-purple-700";
  if (score >= 60) return "text-blue-700";
  if (score >= 40) return "text-green-700";
  return "text-red-700";
}

// ─── Sub-component: Submission Form per assessment ────────────────────────────

type SubmissionFormProps = {
  assessment: Assessment;
  studentId: string;
  existingSub: MySubmission | undefined;
  onSuccess: (sub: MySubmission) => void;
  onCancel: () => void;
};

function SubmissionForm({
  assessment,
  studentId,
  existingSub,
  onSuccess,
  onCancel,
}: SubmissionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [inputStudentId, setInputStudentId] = useState<string>(studentId ?? "");

  const isResubmit = !!existingSub;
  const showUploadUI = !isResubmit || confirmed;
  const isLate = isDeadlinePassed(assessment.deadline);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) return "Only PDF or DOCX files are allowed.";
    if (file.size > 10 * 1024 * 1024) return "File must be under 10 MB.";
    return null;
  };

  const handleFilePick = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFilePick(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
    const sid = inputStudentId.trim();
    if (!sid) {
      setError("Student ID is required.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("studentId", sid);
      formData.append("assessmentId", assessment.id.toString());
      if (isResubmit) formData.append("resubmit", "true");

      const res = await fetch("/api/submissions", { method: "POST", body: formData });
      const result = await res.json();

      if (result.success) {
        onSuccess(result.data);
      } else {
        setError(result.error ?? "Submission failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t border-[#e8e8e0] px-5 py-5 bg-[#fafaf8] space-y-5">
      {/* Late submission warning for past deadlines */}
      {isLate && !existingSub && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Late Submission</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The deadline was {formatDate(assessment.deadline)}. Your submission will be marked as late.
            </p>
          </div>
        </div>
      )}

      <p className="text-sm text-[#4a4a4a] leading-relaxed">{assessment.description}</p>

      {/* Previous submission info banner */}
      {existingSub && (
        <div
          className={`rounded-xl p-4 flex items-center justify-between
          ${
            existingSub.isLate
              ? "bg-orange-50 border border-orange-200"
              : "bg-emerald-50 border border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center
              ${existingSub.isLate ? "bg-orange-100" : "bg-emerald-100"}`}
            >
              <svg
                className={`w-4 h-4 ${existingSub.isLate ? "text-orange-600" : "text-emerald-600"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1a1a2e]">{existingSub.fileName}</p>
              <p className="text-xs text-[#6b6b6b]">
                Submitted {formatDate(existingSub.submittedAt)}
                {existingSub.isLate && (
                  <span className="text-orange-600 font-medium ml-1">· Late submission</span>
                )}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full
            ${
              existingSub.status === "Passed"
                ? "bg-emerald-200 text-emerald-800"
                : existingSub.status === "Failed"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {existingSub.status}
          </span>
        </div>
      )}

      {/* Resubmit confirmation gate */}
      {isResubmit && !confirmed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Replace your submission?</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                You already submitted <span className="font-medium">{existingSub!.fileName}</span>.
                Resubmitting will permanently replace it. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 border border-amber-300 rounded-lg px-4 py-2 text-xs
                         text-amber-800 hover:bg-amber-100 transition-colors font-medium"
            >
              Keep existing
            </button>
            <button
              onClick={() => setConfirmed(true)}
              className="flex-1 bg-amber-600 text-white rounded-lg px-4 py-2 text-xs
                         hover:bg-amber-700 transition-colors font-medium"
            >
              Yes, replace it
            </button>
          </div>
        </div>
      )}

      {/* Upload UI */}
      {showUploadUI && (
        <>
          {/* Student ID field */}
          <div>
            <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-widest block mb-1.5">
              Student ID
            </label>
            <input
              type="text"
              value={inputStudentId}
              onChange={(e) => setInputStudentId(e.target.value)}
              placeholder="e.g. STU-001"
              className="w-full border border-[#d0d0c8] rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1a1a2e] bg-white"
            />
            <p className="text-xs text-[#9a9a9a] mt-1">
              Auto-filled from your session. Edit only if needed.
            </p>
          </div>

          {/* File drop zone */}
          <div>
            <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-widest mb-2">
              {isResubmit ? "Upload replacement file" : "Upload your file"}
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all select-none
                ${
                  dragOver
                    ? "border-[#1a1a2e] bg-[#1a1a2e]/5 scale-[1.01]"
                    : selectedFile
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-[#d0d0c8] hover:border-[#1a1a2e] hover:bg-[#1a1a2e]/3"
                }`}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-1">
                  <svg
                    className="w-7 h-7 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-medium text-emerald-700">{selectedFile.name}</p>
                  <p className="text-xs text-emerald-500">
                    {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </div>
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-[#9a9a9a] mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <p className="text-sm font-medium text-[#1a1a2e]">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-[#9a9a9a] mt-1">PDF or DOCX · Max 10 MB</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFilePick(f);
                e.target.value = "";
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ✕ {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 border border-[#d0d0c8] rounded-lg px-4 py-2 text-sm
                         text-[#4a4a4a] hover:bg-[#f0f0ea] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || !selectedFile}
              className="flex-1 bg-[#1a1a2e] text-white rounded-lg px-4 py-2 text-sm font-medium
                         hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </>
              ) : isResubmit ? (
                "Replace submission"
              ) : (
                isLate ? "Submit (Late)" : "Submit"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-component: Result Checker ────────────────────────────────────────────

function ResultChecker() {
  const [searchId, setSearchId] = useState("");
  const [results, setResults] = useState<GradeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmedId = searchId.trim();
    if (!trimmedId) {
      setError("Please enter a Student ID");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(false);

    try {
      const res = await fetch(`/api/results?studentId=${encodeURIComponent(trimmedId)}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
        setSearched(true);
      } else {
        setError(data.error || "No results found");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        <h2 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-widest">
          Check Your Results
        </h2>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-2xl border border-[#e8e8e0] p-6 shadow-sm">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center">
            <svg className="w-12 h-12 text-purple-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-[#1a1a2e]">View Your Marksheet</h3>
            <p className="text-sm text-[#6b6b6b] mt-1">
              Enter your Student ID to view published results. Only results that have been published by staff will appear.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#6b6b6b] uppercase tracking-widest mb-1.5">
                Student ID
              </label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. STU-001"
                className="w-full border border-[#d0d0c8] rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 bg-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-purple-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium
                           hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">No Results Found</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1a1a2e]">
              Results for <span className="text-purple-600 font-mono">{searchId}</span>
            </h3>
            <span className="text-xs text-[#9a9a9a]">
              {results.length} assessment{results.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-2xl border border-[#e8e8e0] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Assessment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1a1a2e] text-sm">
                          {result.assessment.name}
                        </h4>
                        <p className="text-xs text-[#9a9a9a] mt-0.5">
                          Deadline: {formatDate(result.assessment.deadline)}
                        </p>
                        {result.submission && (
                          <p className="text-xs text-[#6b6b6b] mt-1">
                            Submitted: {formatDate(result.submission.submittedAt)}
                            {result.submission.isLate && (
                              <span className="text-orange-600 font-medium ml-2">· Late</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${getClassificationColor(result.classification)}`}>
                      {result.classification}
                    </span>
                  </div>

                  {/* Score Display */}
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#9a9a9a] uppercase tracking-widest">Score</p>
                      <p className={`text-3xl font-bold mt-1 ${getScoreColor(result.score)}`}>
                        {result.score}
                        <span className="text-lg text-gray-400 font-normal">/100</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#9a9a9a]">Graded On</p>
                      <p className="text-sm text-[#4a4a4a] mt-1">{formatDate(result.gradedAt)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          result.score >= 70 ? "bg-purple-500" :
                          result.score >= 60 ? "bg-blue-500" :
                          result.score >= 40 ? "bg-green-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">0</span>
                      <span className="text-xs text-gray-400">40 (Pass)</span>
                      <span className="text-xs text-gray-400">60 (Merit)</span>
                      <span className="text-xs text-gray-400">70 (Distinction)</span>
                      <span className="text-xs text-gray-400">100</span>
                    </div>
                  </div>

                  {/* Submission Link */}
                  {result.submission && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={result.submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-purple-600 hover:text-purple-800 underline"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        View Submission: {result.submission.fileName}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {searched && results.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-[#e8e8e0] p-12 text-center shadow-sm">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No published results found</p>
          <p className="text-xs text-gray-400 mt-1">
            Results may not be available yet or have not been published by staff.
          </p>
        </div>
      )}
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentPage = ({ studentId }: { studentId: string }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err" | "warn"; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"assignments" | "results">("assignments");

  const showToast = (type: "ok" | "err" | "warn", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          fetch("/api/assesment"),
          fetch(`/api/submissions?studentId=${encodeURIComponent(studentId)}`),
        ]);
        const aData = await aRes.json();
        const sData = await sRes.json();

        if (aData.success && Array.isArray(aData.data)) {
          setAssessments(
            aData.data.map(
              (item: {
                id: number;
                name: string;
                createdDate: string;
                deadline: string;
                description: string;
              }) => ({
                id: item.id,
                name: item.name,
                createdDate: new Date(item.createdDate).toISOString().split("T")[0],
                deadline: new Date(item.deadline).toISOString().split("T")[0],
                description: item.description,
              })
            )
          );
        }

        if (sData.success && Array.isArray(sData.data)) {
          setMySubmissions(sData.data);
        }
      } catch (err) {
        console.error(err);
        showToast("err", "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const getSubmission = (assessmentId: number): MySubmission | undefined =>
    mySubmissions.find((s) => s.assessmentId === assessmentId);

  const handleSubmitSuccess = (sub: MySubmission) => {
    setMySubmissions((prev) => {
      const idx = prev.findIndex((s) => s.assessmentId === sub.assessmentId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = sub;
        return updated;
      }
      return [...prev, sub];
    });

    const wasResubmit = mySubmissions.some((s) => s.assessmentId === sub.assessmentId);
    showToast(
      sub.isLate ? "warn" : "ok",
      wasResubmit
        ? sub.isLate
          ? "Resubmitted (late) — your previous file has been replaced."
          : "Resubmitted successfully — your previous file has been replaced."
        : sub.isLate
        ? "Submitted (late) — marked as late submission."
        : "Submitted successfully!"
    );
    setActiveAssessment(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#6b6b6b] font-mono">Loading assignments…</p>
        </div>
      </div>
    );
  }

  const open = assessments.filter((a) => !isDeadlinePassed(a.deadline));
  const closed = assessments.filter((a) => isDeadlinePassed(a.deadline));

  return (
    <div className="min-h-screen bg-[#f7f6f2] font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3
          rounded-xl shadow-lg text-sm font-medium
          ${
            toast.type === "ok"
              ? "bg-[#1a1a2e] text-white"
              : toast.type === "warn"
              ? "bg-amber-600 text-white"
              : "bg-[#e63946] text-white"
          }`}
        >
          <span>{toast.type === "ok" ? "✓" : toast.type === "warn" ? "⚠" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1a1a2e] text-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-[#8888aa] uppercase tracking-widest mb-0.5">
              Student Portal
            </p>
            <h1 className="text-xl font-bold tracking-tight">My Assignments</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8888aa] font-mono">Student ID</p>
            <p className="text-sm font-mono font-semibold">{studentId || "—"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "assignments"
                ? "bg-white/20 text-white"
                : "text-[#8888aa] hover:text-white hover:bg-white/10"
            }`}
          >
            📝 Assignments
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "results"
                ? "bg-white/20 text-white"
                : "text-[#8888aa] hover:text-white hover:bg-white/10"
            }`}
          >
            📊 Results
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === "assignments" ? (
          <div className="space-y-10">
            {/* Open assessments */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-widest">
                  Open ({open.length})
                </h2>
              </div>

              {open.length === 0 && (
                <p className="text-sm text-[#9a9a9a] italic">No open assignments right now.</p>
              )}

              <div className="space-y-3">
                {open.map((a) => {
                  const sub = getSubmission(a.id);
                  const days = daysUntil(a.deadline);
                  const isExp = activeAssessment?.id === a.id;

                  return (
                    <div
                      key={a.id}
                      className="bg-white rounded-2xl border border-[#e8e8e0] overflow-hidden shadow-sm"
                    >
                      <div
                        className="flex items-center justify-between px-5 py-4
                                   hover:bg-[#fafaf8] transition-colors cursor-pointer"
                        onClick={() => setActiveAssessment(isExp ? null : a)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a1a2e] text-sm">{a.name}</p>
                            <p className="text-xs text-[#9a9a9a] mt-0.5">Due {formatDate(a.deadline)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-xs font-mono px-2.5 py-1 rounded-full ${
                            days <= 1 ? "bg-red-100 text-red-700" : days <= 3 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {days <= 0 ? "Today" : `${days}d left`}
                          </span>

                          {sub ? (
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                              sub.isLate ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {sub.isLate ? "⚠ Late" : "✓ Submitted"}
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#f0f0ea] text-[#6b6b6b] border border-[#e0e0d8]">
                              Not submitted
                            </span>
                          )}

                          <svg className={`w-4 h-4 text-[#9a9a9a] transition-transform ${isExp ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {isExp && (
                        <SubmissionForm
                          assessment={a}
                          studentId={studentId}
                          existingSub={sub}
                          onSuccess={handleSubmitSuccess}
                          onCancel={() => setActiveAssessment(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Past assessments */}
            {closed.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#9a9a9a]" />
                  <h2 className="text-sm font-semibold text-[#6b6b6b] uppercase tracking-widest">
                    Past ({closed.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {closed.map((a) => {
                    const sub = getSubmission(a.id);
                    const isExp = activeAssessment?.id === a.id;

                    return (
                      <div key={a.id} className="bg-white rounded-2xl border border-[#e8e8e0] overflow-hidden shadow-sm">
                        <div
                          className="flex items-center justify-between px-5 py-4 hover:bg-[#fafaf8] transition-colors cursor-pointer"
                          onClick={() => setActiveAssessment(isExp ? null : a)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#6b6b6b] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-[#1a1a2e] text-sm">{a.name}</p>
                              <p className="text-xs text-[#9a9a9a] mt-0.5">Closed {formatDate(a.deadline)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {sub ? (
                              <>
                                {sub.isLate && (
                                  <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">Late</span>
                                )}
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  sub.status === "Passed" ? "bg-emerald-100 text-emerald-700" : sub.status === "Failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                                }`}>
                                  {sub.status}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Missing</span>
                            )}

                            <svg className={`w-4 h-4 text-[#9a9a9a] transition-transform ${isExp ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {isExp && (
                          <SubmissionForm
                            assessment={a}
                            studentId={studentId}
                            existingSub={sub}
                            onSuccess={handleSubmitSuccess}
                            onCancel={() => setActiveAssessment(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Results Tab */
          <ResultChecker />
        )}
      </main>
    </div>
  );
};

export default StudentPage;