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

// ─── Component ────────────────────────────────────────────────────────────────

const StudentPage = ({ studentId }: { studentId: string }) => {
  const [assessments,      setAssessments]      = useState<Assessment[]>([]);
  const [mySubmissions,    setMySubmissions]    = useState<MySubmission[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [uploading,        setUploading]        = useState<number | null>(null);   // assessmentId
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [dragOver,         setDragOver]         = useState(false);
  const [toast,            setToast]            = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch assessments ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          fetch("/api/assesment"),
          fetch(`/api/submissions?studentId=${studentId}`),
        ]);
        const aData = await aRes.json();
        const sData = await sRes.json();

        if (aData.success && Array.isArray(aData.data)) {
          setAssessments(
            aData.data.map((item: any) => ({
              id:          item.id,
              name:        item.name,
              createdDate: new Date(item.createdDate).toISOString().split("T")[0],
              deadline:    new Date(item.deadline).toISOString().split("T")[0],
              description: item.description,
            }))
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

  // ── Get submission for an assessment ──────────────────────────────────────
  const getSubmission = (assessmentId: number): MySubmission | undefined =>
    mySubmissions.find((s) => s.assessmentId === assessmentId);

  // ── Handle file submit ─────────────────────────────────────────────────────
  const handleFileSubmit = async (file: File, assessment: Assessment) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) {
      showToast("err", "Only PDF or DOCX files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("err", "File must be under 10 MB.");
      return;
    }

    setUploading(assessment.id);
    try {
      const formData = new FormData();
      formData.append("file",         file);
      formData.append("studentId", student.studentId)
      formData.append("assessmentId", assessment.id.toString());

      const res    = await fetch("/api/submissions", { method: "POST", body: formData });
      const result = await res.json();

      if (result.success) {
        // Upsert locally
        setMySubmissions((prev) => {
          const exists = prev.findIndex((s) => s.assessmentId === assessment.id);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = result.data;
            return updated;
          }
          return [...prev, result.data];
        });
        showToast("ok", result.data.isLate
          ? "Submitted (late) — marked as late submission."
          : "Submitted successfully!");
        setActiveAssessment(null);
      } else {
        showToast("err", result.error ?? "Submission failed.");
      }
    } catch (err) {
      console.error(err);
      showToast("err", "Upload failed. Try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleDrop = (e: React.DragEvent, assessment: Assessment) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSubmit(file, assessment);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, assessment: Assessment) => {
    const file = e.target.files?.[0];
    if (file) handleFileSubmit(file, assessment);
    e.target.value = "";
  };

  // ─────────────────────────────────────────────────────────────────────────
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

  const open   = assessments.filter((a) => !isDeadlinePassed(a.deadline));
  const closed = assessments.filter((a) =>  isDeadlinePassed(a.deadline));

  return (
    <div className="min-h-screen bg-[#f7f6f2] font-sans">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
            ${toast.type === "ok"
              ? "bg-[#1a1a2e] text-white"
              : "bg-[#e63946] text-white"}`}
        >
          <span>{toast.type === "ok" ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1a1a2e] text-white px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-[#8888aa] uppercase tracking-widest mb-0.5">Student Portal</p>
          <h1 className="text-xl font-bold tracking-tight">My Assignments</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#8888aa] font-mono">ID</p>
          <p className="text-sm font-mono font-semibold">{studentId}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* ── Open assessments ─────────────────────────────────────────────── */}
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
              const sub   = getSubmission(a.id);
              const days  = daysUntil(a.deadline);
              const isUp  = uploading === a.id;
              const isExp = activeAssessment?.id === a.id;

              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-[#e8e8e0] overflow-hidden shadow-sm"
                >
                  {/* Card header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#fafaf8] transition-colors"
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
                      {/* Days left badge */}
                      <span className={`text-xs font-mono px-2.5 py-1 rounded-full
                        ${days <= 1 ? "bg-red-100 text-red-700" : days <= 3 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {days <= 0 ? "Today" : `${days}d left`}
                      </span>

                      {/* Submission status chip */}
                      {sub ? (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
                          ${sub.isLate
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                          {sub.isLate ? "⚠ Late" : "✓ Submitted"}
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#f0f0ea] text-[#6b6b6b] border border-[#e0e0d8]">
                          Not submitted
                        </span>
                      )}

                      <svg className={`w-4 h-4 text-[#9a9a9a] transition-transform ${isExp ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExp && (
                    <div className="border-t border-[#e8e8e0] px-5 py-5 bg-[#fafaf8] space-y-5">
                      <p className="text-sm text-[#4a4a4a] leading-relaxed">{a.description}</p>

                      {/* Existing submission info */}
                      {sub && (
                        <div className={`rounded-xl p-4 flex items-center justify-between
                          ${sub.isLate ? "bg-orange-50 border border-orange-200" : "bg-emerald-50 border border-emerald-200"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                              ${sub.isLate ? "bg-orange-100" : "bg-emerald-100"}`}>
                              <svg className={`w-4 h-4 ${sub.isLate ? "text-orange-600" : "text-emerald-600"}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#1a1a2e]">{sub.fileName}</p>
                              <p className="text-xs text-[#6b6b6b]">
                                Submitted {formatDate(sub.submittedAt)}
                                {sub.isLate && <span className="text-orange-600 font-medium ml-1">· Late submission</span>}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                            ${sub.status === "Passed" ? "bg-emerald-200 text-emerald-800"
                              : sub.status === "Failed" ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"}`}>
                            {sub.status}
                          </span>
                        </div>
                      )}

                      {/* Upload zone */}
                      <div>
                        <p className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-widest mb-2">
                          {sub ? "Resubmit (replaces previous)" : "Upload your file"}
                        </p>

                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => handleDrop(e, a)}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                            ${dragOver
                              ? "border-[#1a1a2e] bg-[#1a1a2e]/5 scale-[1.01]"
                              : "border-[#d0d0c8] hover:border-[#1a1a2e] hover:bg-[#1a1a2e]/3"}`}
                        >
                          {isUp ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm text-[#6b6b6b]">Uploading…</p>
                            </div>
                          ) : (
                            <>
                              <svg className="w-8 h-8 text-[#9a9a9a] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                              <p className="text-sm font-medium text-[#1a1a2e]">Drop file here or click to browse</p>
                              <p className="text-xs text-[#9a9a9a] mt-1">PDF or DOCX · Max 10 MB</p>
                            </>
                          )}
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx"
                          className="hidden"
                          onChange={(e) => handleInputChange(e, a)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Closed / past assessments ─────────────────────────────────────── */}
        {closed.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#9a9a9a]" />
              <h2 className="text-sm font-semibold text-[#6b6b6b] uppercase tracking-widest">
                Past ({closed.length})
              </h2>
            </div>

            <div className="space-y-2">
              {closed.map((a) => {
                const sub = getSubmission(a.id);
                return (
                  <div key={a.id} className="bg-white/70 rounded-xl border border-[#e8e8e0] px-5 py-4 flex items-center justify-between opacity-75">
                    <div>
                      <p className="text-sm font-medium text-[#4a4a4a]">{a.name}</p>
                      <p className="text-xs text-[#9a9a9a]">Closed {formatDate(a.deadline)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub ? (
                        <>
                          {sub.isLate && (
                            <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">Late</span>
                          )}
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                            ${sub.status === "Passed" ? "bg-emerald-100 text-emerald-700"
                              : sub.status === "Failed" ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"}`}>
                            {sub.status}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-[#9a9a9a] italic">Not submitted</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default StudentPage;