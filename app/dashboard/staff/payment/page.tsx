"use client"

import { useEffect, useState } from "react"

type PaymentStatus = "Completed" | "Overdue" | "Due"

type Student = {
  id: string
  studentId: string
  name: string
  email?: string
  programmeId?: string
  programme?: string
  enrollmentStatus?: string
  totalFee: number
  halfFee: number
  fullFee: number
  adjustedFee: number
  halfDueDate: string
  halfPaidDate: string | null
  halfReferenceNo: string | null
  fullDueDate: string
  fullPaidDate: string | null
  fullReferenceNo: string | null
}

type Notification = {
  type: "success" | "error"
  message: string
}

type ApiStudent = {
  studentId: string
  id: string
  name: string
  email?: string
  dateOfBirth?: string
  programmeId?: string
  academicYear?: string
  status?: string
  totalFee?: number
  halfFee?: number
  fullFee?: number
  adjustedFee?: number
  halfDueDate: string | null
  halfPaidDate: string | null
  halfReferenceNo: string | null
  fullDueDate: string | null
  fullPaidDate: string | null
  fullReferenceNo: string | null
}

type Programme = {
  id: string
  name: string
  code: string
  feeAmount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatus(student: Student): PaymentStatus {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const halfDue = student.halfDueDate ? new Date(student.halfDueDate) : null
  const fullDue = student.fullDueDate ? new Date(student.fullDueDate) : null

  const halfOverdue = !student.halfPaidDate && halfDue !== null && halfDue < now
  const fullOverdue = !student.fullPaidDate && fullDue !== null && fullDue < now

  if (halfOverdue || fullOverdue) return "Overdue"
  if (student.halfPaidDate && student.fullPaidDate) return "Completed"
  return "Due"
}

function getOverdueDetails(student: Student): { half: boolean; full: boolean } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const halfDue = student.halfDueDate ? new Date(student.halfDueDate) : null
  const fullDue = student.fullDueDate ? new Date(student.fullDueDate) : null

  return {
    half: !student.halfPaidDate && halfDue !== null && halfDue < now,
    full: !student.fullPaidDate && fullDue !== null && fullDue < now,
  }
}

/**
 * Outstanding balance:
 *   - If neither half nor full paid  → full totalFee
 *   - If only half paid              → totalFee - halfFee
 *   - If only full paid              → totalFee - fullFee  (edge case)
 *   - If both paid                   → 0
 */
function getOutstanding(student: Student): number {
  const total = student.totalFee ?? 0
  const half  = student.halfFee  ?? total / 2
  const full  = student.fullFee  ?? total

  const halfPaid = !!student.halfPaidDate
  const fullPaid = !!student.fullPaidDate

  if (halfPaid && fullPaid) return 0
  if (halfPaid && !fullPaid) return Math.max(0, total - half)
  if (!halfPaid && fullPaid) return Math.max(0, total - full)
  return total
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const statusStyles: Record<PaymentStatus, string> = {
  Completed: "bg-green-100 text-green-800 border border-green-200",
  Overdue:   "bg-red-100   text-red-800   border border-red-200",
  Due:       "bg-yellow-100 text-yellow-800 border border-yellow-200",
}

const statusDot: Record<PaymentStatus, string> = {
  Completed: "bg-green-500",
  Overdue:   "bg-red-500",
  Due:       "bg-yellow-500",
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FeesPage() {
  const [students,        setStudents]        = useState<Student[]>([])
  const [loading,         setLoading]         = useState(true)
  const [notification,    setNotification]    = useState<Notification | null>(null)
  const [savingId,        setSavingId]        = useState<string | null>(null)
  const [assigningFees,   setAssigningFees]   = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [programmes,      setProgrammes]      = useState<Programme[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [customFee,       setCustomFee]       = useState("")
  const [halfDueDate,     setHalfDueDate]     = useState("")
  const [fullDueDate,     setFullDueDate]     = useState("")

  // ── Summary totals (derived, no extra state needed) ──────────────────────
  const totalFeeSum     = students.reduce((s, st) => s + (st.totalFee ?? 0), 0)
  const outstandingSum  = students.reduce((s, st) => s + getOutstanding(st), 0)
  const collectedSum    = totalFeeSum - outstandingSum
  const overdueCount    = students.filter((st) => getStatus(st) === "Overdue").length

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchProgrammes = async () => {
    try {
      const res  = await fetch("/api/programmes")
      const data = await res.json()
      if (data.success) setProgrammes(data.data as Programme[])
    } catch (err) {
      console.error("Error fetching programmes:", err)
    }
  }

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const res  = await fetch("/api/students", { headers: { "Content-Type": "application/json" } })
        const data = await res.json()

        if (data.success && Array.isArray(data.data)) {

          const transformed: Student[] = (data.data as ApiStudent[])
            .filter((s) => s.status === "Enrolled")
            .map((s) => ({
              id:               s.id,
              studentId:        s.studentId,
              name:             s.name             ?? "",
              email:            s.email            ?? "",
              programmeId:      s.programmeId      ?? "",
              programme:        s.programmeId      ?? "",
              enrollmentStatus: s.status           ?? "",
              totalFee:         s.totalFee         ?? 0,
              halfFee:          s.halfFee          ?? (s.totalFee ?? 0) / 2,
              fullFee:          s.fullFee          ?? s.totalFee ?? 0,
              adjustedFee:      s.adjustedFee      ?? 0,
              halfDueDate:      s.halfDueDate      ?? "",
              halfPaidDate:     s.halfPaidDate      ?? null,
              halfReferenceNo:  s.halfReferenceNo  ?? null,
              fullDueDate:      s.fullDueDate      ?? "",
              fullPaidDate:     s.fullPaidDate      ?? null,
              fullReferenceNo:  s.fullReferenceNo  ?? null,
            }))

          setStudents(transformed)
          setNotification({ type: "success", message: `Loaded ${transformed.length} students` })
          setTimeout(() => setNotification(null), 3000)
        }
      } catch (err) {
        console.error("Error fetching students:", err)
        setNotification({ type: "error", message: "Failed to load students from database" })
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
    fetchProgrammes()
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAssignFees = async () => {
    try {
      setAssigningFees(true)
      const res    = await fetch("/api/fees/assign-all", { method: "POST", headers: { "Content-Type": "application/json" } })
      const result = await res.json()
      if (result.success) {
        setNotification({ type: "success", message: "Fees assigned to all students!" })
        window.location.reload()
      } else {
        setNotification({ type: "error", message: result.error ?? "Failed to assign fees" })
      }
    } catch (err) {
      console.error(err)
      setNotification({ type: "error", message: "Failed to assign fees" })
    } finally {
      setAssigningFees(false)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleOpenAssignModal = (student: Student) => {
    setSelectedStudent(student)
    const prog = programmes.find((p) => p.code === student.programmeId || p.id === student.programmeId)
    setCustomFee(prog?.feeAmount?.toString() ?? student.totalFee?.toString() ?? "")
    setHalfDueDate(student.halfDueDate?.split("T")[0] ?? "")
    setFullDueDate(student.fullDueDate?.split("T")[0] ?? "")
    setShowAssignModal(true)
  }

  const handleAssignFee = async () => {
    if (!selectedStudent) return
    try {
      const res    = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:       selectedStudent.studentId,
          customFeeAmount: parseFloat(customFee),
          halfDueDate:     halfDueDate || null,
          fullDueDate:     fullDueDate || null,
        }),
      })
      const result = await res.json()

      if (result.success) {
        const fee = parseFloat(customFee)
        setStudents((prev) =>
          prev.map((s) =>
            s.studentId === selectedStudent.studentId
              ? { ...s, totalFee: fee, halfFee: fee / 2, fullFee: fee, adjustedFee: fee,
                  halfDueDate: halfDueDate || s.halfDueDate,
                  fullDueDate: fullDueDate || s.fullDueDate }
              : s
          )
        )
        setNotification({ type: "success", message: "Fee and due dates assigned successfully!" })
        setShowAssignModal(false)
      } else {
        setNotification({ type: "error", message: result.error ?? "Failed" })
      }
    } catch (err) {
      console.error(err)
      setNotification({ type: "error", message: "Failed to assign fee" })
    }
    setTimeout(() => setNotification(null), 3000)
  }

  const handleChange = (id: string, field: keyof Student, value: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value || null } : s))
    )
  }

  const handleSave = async (studentId: string) => {
    const student = students.find((s) => s.studentId === studentId)
    if (!student) return
    setSavingId(studentId)
    try {
      const res  = await fetch(`/api/students/${student.studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          halfDueDate:     student.halfDueDate     || null,
          halfPaidDate:    student.halfPaidDate    || null,
          halfReferenceNo: student.halfReferenceNo || null,
          fullDueDate:     student.fullDueDate     || null,
          fullPaidDate:    student.fullPaidDate    || null,
          fullReferenceNo: student.fullReferenceNo || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotification({ type: "success", message: `Payment for ${student.name} saved!` })
      } else {
        throw new Error(data.message ?? "Failed to save payment")
      }
      setTimeout(() => setNotification(null), 4000)
    } catch (err) {
      setNotification({ type: "error", message: err instanceof Error ? err.message : "Failed to save payment" })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-medium mb-6">Fees and Payments — Enrolled Students</h1>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading students from database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">

      {/* Header */}

      {/* ── Real-time summary cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Total Billed</p>
          <p className="text-lg font-bold text-gray-800">৳{totalFeeSum.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-600 mb-1">Collected</p>
          <p className="text-lg font-bold text-green-700">৳{collectedSum.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-600 mb-1">Outstanding</p>
          <p className="text-lg font-bold text-red-700">৳{outstandingSum.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs text-orange-600 mb-1">Overdue Students</p>
          <p className="text-lg font-bold text-orange-700">{overdueCount}</p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg border-l-4 ${
            notification.type === "success"
              ? "bg-green-100 border-green-500 text-green-800"
              : "bg-red-100 border-red-500 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Table */}
      {students.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No students found. Please add students first.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Programme</th>
                <th className="px-4 py-3 text-left">Total Fee</th>
                <th className="px-4 py-3 text-left">Outstanding</th>
                <th className="px-4 py-3 text-left">Half Due</th>
                <th className="px-4 py-3 text-left">Half Paid</th>
                <th className="px-4 py-3 text-left">Half Ref No</th>
                <th className="px-4 py-3 text-left">Full Due</th>
                <th className="px-4 py-3 text-left">Full Paid</th>
                <th className="px-4 py-3 text-left">Full Ref No</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const paymentStatus  = getStatus(student)
                const overdueDetails = getOverdueDetails(student)
                const outstanding    = getOutstanding(student)
                const rowBg = paymentStatus === "Overdue" ? "bg-red-50/40" : ""

                return (
                  <tr key={student.id} className={`hover:bg-gray-50 ${rowBg}`}>
                    <td className="px-4 py-3 font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-gray-500">{student.programme}</td>

                    <td className="px-4 py-3 font-semibold text-indigo-600">
                      ৳{(student.totalFee ?? 0).toLocaleString()}
                    </td>

                    {/* ── Outstanding balance cell ────────────────────────── */}
                    <td className="px-4 py-3">
                      {outstanding === 0 ? (
                        <span className="text-xs font-semibold text-green-600">Paid in full</span>
                      ) : (
                        <span className={`text-xs font-bold ${paymentStatus === "Overdue" ? "text-red-600" : "text-orange-600"}`}>
                          ৳{outstanding.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Half Due */}
                    <td className="px-4 py-3">
                      {student.halfDueDate ? (
                        <span className={`text-xs font-medium ${overdueDetails.half ? "text-red-600" : "text-gray-500"}`}>
                          {overdueDetails.half && <span className="mr-1">⚠</span>}
                          {student.halfDueDate.split("T")[0]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Not set</span>
                      )}
                    </td>

                    {/* Half Paid date */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={student.halfPaidDate?.split("T")[0] ?? ""}
                        onChange={(e) => handleChange(student.id, "halfPaidDate", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                      />
                    </td>

                    {/* Half Ref No */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={student.halfReferenceNo ?? ""}
                        placeholder="PAY-XXX"
                        onChange={(e) => handleChange(student.id, "halfReferenceNo", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-24"
                      />
                    </td>

                    {/* Full Due */}
                    <td className="px-4 py-3">
                      {student.fullDueDate ? (
                        <span className={`text-xs font-medium ${overdueDetails.full ? "text-red-600" : "text-gray-500"}`}>
                          {overdueDetails.full && <span className="mr-1">⚠</span>}
                          {student.fullDueDate.split("T")[0]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Not set</span>
                      )}
                    </td>

                    {/* Full Paid date */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={student.fullPaidDate?.split("T")[0] ?? ""}
                        onChange={(e) => handleChange(student.id, "fullPaidDate", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                      />
                    </td>

                    {/* Full Ref No */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={student.fullReferenceNo ?? ""}
                        placeholder="PAY-XXX"
                        onChange={(e) => handleChange(student.id, "fullReferenceNo", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-24"
                      />
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusStyles[paymentStatus]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[paymentStatus]}`} />
                        {paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenAssignModal(student)}
                          className="text-xs px-2 py-1 rounded border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleSave(student.studentId)}
                          disabled={savingId === student.studentId}
                          className="text-xs px-2 py-1 rounded border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingId === student.studentId ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* ── Table footer totals ────────────────────────────────────── */}
            <tfoot className="bg-gray-50 text-xs font-semibold border-t-2 border-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-600" colSpan={2}>Totals ({students.length} students)</td>
                <td className="px-4 py-3 text-indigo-700">৳{totalFeeSum.toLocaleString()}</td>
                <td className="px-4 py-3 text-red-600">৳{outstandingSum.toLocaleString()}</td>
                <td colSpan={8} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Assign Fee Modal ──────────────────────────────────────────────── */}
      {showAssignModal && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-white">Assign Fee</h3>
              <p className="text-sm text-indigo-200">{selectedStudent.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
                <p className="text-gray-900 font-medium">{selectedStudent.programme}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (৳)</label>
                <input
                  type="number"
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Enter fee amount"
                />
                {/* Live preview of half/full split */}
                {customFee && !isNaN(parseFloat(customFee)) && (
                  <p className="text-xs text-gray-400 mt-1">
                    Half: ৳{(parseFloat(customFee) / 2).toLocaleString()} · Full: ৳{parseFloat(customFee).toLocaleString()}
                  </p>
                )}
              </div>

              {programmes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or select programme fee:</label>
                  <div className="flex flex-wrap gap-2">
                    {programmes.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setCustomFee(p.feeAmount.toString())}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-indigo-100 rounded-full border transition-colors"
                      >
                        {p.code} — ৳{p.feeAmount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Dates */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Payment Due Dates</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Half Payment Due</label>
                    <input
                      type="date"
                      value={halfDueDate}
                      onChange={(e) => setHalfDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      ৳{customFee && !isNaN(parseFloat(customFee)) ? (parseFloat(customFee) / 2).toLocaleString() : "0"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Payment Due</label>
                    <input
                      type="date"
                      value={fullDueDate}
                      onChange={(e) => setFullDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      ৳{customFee && !isNaN(parseFloat(customFee)) ? parseFloat(customFee).toLocaleString() : "0"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
                  <span>⚠</span>
                  <span>If payment is not made by the due date, status will show as <strong>Overdue</strong>.</span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignFee}
                disabled={!customFee || isNaN(parseFloat(customFee))}
                className="flex-1 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Assign Fee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
