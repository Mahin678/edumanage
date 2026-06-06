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
  enrollmentStatus?: string   // renamed from "status" to avoid collision with PaymentStatus
  totalFee?: number
  halfFee?: number
  fullFee?: number
  adjustedFee?: number
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
 
// ✅ Guard against empty/null date strings before constructing Date objects
function getStatus(student: Student): PaymentStatus {
  const now = new Date()
 
  const halfDue = student.halfDueDate ? new Date(student.halfDueDate) : null
  const fullDue = student.fullDueDate ? new Date(student.fullDueDate) : null
 
  const halfOverdue = !student.halfPaidDate && halfDue !== null && halfDue < now
  const fullOverdue = !student.fullPaidDate && fullDue !== null && fullDue < now
 
  if (halfOverdue || fullOverdue) return "Overdue"
 
  const bothPaid = !!student.halfPaidDate && !!student.fullPaidDate
  if (bothPaid) return "Completed"
 
  return "Due"
}
 
const statusStyles: Record<PaymentStatus, string> = {
  Completed: "bg-green-100 text-green-800",
  Overdue:   "bg-red-100 text-red-800",
  Due:       "bg-yellow-100 text-yellow-800",
}
 
export default function FeesPage() {
  const [students,       setStudents]       = useState<Student[]>([])
  const [loading,        setLoading]        = useState(true)
  const [notification,   setNotification]   = useState<Notification | null>(null)
  const [savingId,       setSavingId]       = useState<string | null>(null)
  const [assigningFees,  setAssigningFees]  = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [programmes,     setProgrammes]     = useState<Programme[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [customFee,      setCustomFee]      = useState("")
 
  // ✅ Fetch programmes (now actually called via useEffect)
  const fetchProgrammes = async () => {
    try {
      const response = await fetch("/api/programmes")
      const data = await response.json()
      if (data.success) setProgrammes(data.data)
    } catch (error) {
      console.error("Error fetching programmes:", error)
    }
  }
 
  // ✅ Fetch students + programmes on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/students", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
 
        const data = await response.json()
 
        if (data.success && Array.isArray(data.data)) {
          const transformedStudents: Student[] = data.data
            .filter((student: ApiStudent) => student.status === "Enrolled")
            .map((student: ApiStudent) => ({
              id:             student.id,
              studentId:      student.studentId,
              name:           student.name || "",
              email:          student.email || "",
              programmeId:    student.programmeId || "",
              programme:      student.programmeId || "",
              enrollmentStatus: student.status || "",
              totalFee:       student.totalFee    ?? 0,
              halfFee:        student.halfFee     ?? 0,
              fullFee:        student.fullFee     ?? 0,
              adjustedFee:    student.adjustedFee ?? 0,
              halfDueDate:    student.halfDueDate  ?? "",
              halfPaidDate:   student.halfPaidDate ?? null,
              halfReferenceNo: student.halfReferenceNo ?? null,
              fullDueDate:    student.fullDueDate  ?? "",
              fullPaidDate:   student.fullPaidDate ?? null,
              fullReferenceNo: student.fullReferenceNo ?? null,
            }))
 
          setStudents(transformedStudents)
          setNotification({
            type: "success",
            message: `Loaded ${transformedStudents.length} students from database`,
          })
          setTimeout(() => setNotification(null), 3000)
        }
      } catch (error) {
        console.error("Error fetching students:", error)
        setNotification({
          type: "error",
          message: "Failed to load students from database",
        })
      } finally {
        setLoading(false)
      }
    }
 
    fetchStudents()
    fetchProgrammes()   // ✅ was defined but never called before
  }, [])
 
  // ✅ Assign fees to ALL enrolled students from their programme (was missing entirely)
  const handleAssignFees = async () => {
    try {
      setAssigningFees(true)
      const response = await fetch("/api/fees/assign-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.json()
 
      if (result.success) {
        setNotification({ type: "success", message: "Fees assigned to all students!" })
        window.location.reload()
      } else {
        setNotification({ type: "error", message: result.error || "Failed to assign fees" })
      }
    } catch (error) {
      console.error("Error assigning fees:", error)
      setNotification({ type: "error", message: "Failed to assign fees" })
    } finally {
      setAssigningFees(false)
      setTimeout(() => setNotification(null), 3000)
    }
  }
 
  // Open assign modal for a single student
  const handleOpenAssignModal = (student: Student) => {
    setSelectedStudent(student)
    const prog = programmes.find(
      (p) => p.code === student.programmeId || p.id === student.programmeId
    )
    setCustomFee(prog?.feeAmount?.toString() || student.totalFee?.toString() || "")
    setShowAssignModal(true)
  }
 
  // Assign fee to single student
  const handleAssignFee = async () => {
    if (!selectedStudent) return
 
    try {
      const response = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:       selectedStudent.studentId,
          customFeeAmount: parseFloat(customFee),
        }),
      })
      const result = await response.json()
 
      if (result.success) {
        setNotification({ type: "success", message: "Fee assigned successfully!" })
        setShowAssignModal(false)
        window.location.reload()
      } else {
        setNotification({ type: "error", message: result.error || "Failed" })
      }
    } catch (error) {
      console.error("Error assigning fee:", error)
      setNotification({ type: "error", message: "Failed to assign fee" })
    }
    setTimeout(() => setNotification(null), 3000)
  }
 
  // Handle inline field edits
  function handleChange(id: string, field: keyof Student, value: string) {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value || null } : s))
    )
  }
 
  // Save payment data for one student
  async function handleSave(studentStudentId: string) {
    const student = students.find((s) => s.studentId === studentStudentId)
    if (!student) return
 
    setSavingId(studentStudentId)
 
    try {
      const response = await fetch(`/api/students/${student.studentId}`, {
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
 
      const data = await response.json()
 
      if (response.ok) {
        setNotification({
          type: "success",
          message: `Payment for ${student.name} saved successfully!`,
        })
      } else {
        throw new Error(data.message || "Failed to save payment")
      }
 
      setTimeout(() => setNotification(null), 4000)
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save payment",
      })
    } finally {
      setSavingId(null)
    }
  }
 
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-medium mb-6">Fees and Payments only for Enrolled Students</h1>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading students from database...</p>
        </div>
      </div>
    )
  }
 
  return (
    // ✅ Single root element wrapping BOTH the main content AND the modal
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-medium">Fees and Payments for Enrolled Students</h1>
        <button
          onClick={handleAssignFees}
          disabled={assigningFees}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50 text-sm"
        >
          {assigningFees ? "Assigning..." : "Assign Fees from Programme"}
        </button>
      </div>
 
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
                <th className="px-4 py-3 text-left">Half Paid</th>
                <th className="px-4 py-3 text-left">Half Ref No</th>
                <th className="px-4 py-3 text-left">Full Paid</th>
                <th className="px-4 py-3 text-left">Full Ref No</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const paymentStatus = getStatus(student)
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-gray-500">{student.programme}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">
                      ৳{student.totalFee?.toLocaleString() || "0"}
                    </td>
 
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={student.halfPaidDate?.split("T")[0] ?? ""}
                        onChange={(e) =>
                          handleChange(student.id, "halfPaidDate", e.target.value)
                        }
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={student.halfReferenceNo ?? ""}
                        placeholder="PAY-XXX"
                        onChange={(e) =>
                          handleChange(student.id, "halfReferenceNo", e.target.value)
                        }
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-24"
                      />
                    </td>
 
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={student.fullPaidDate?.split("T")[0] ?? ""}
                        onChange={(e) =>
                          handleChange(student.id, "fullPaidDate", e.target.value)
                        }
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={student.fullReferenceNo ?? ""}
                        placeholder="PAY-XXX"
                        onChange={(e) =>
                          handleChange(student.id, "fullReferenceNo", e.target.value)
                        }
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-24"
                      />
                    </td>
 
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[paymentStatus]}`}
                      >
                        {paymentStatus}
                      </span>
                    </td>
 
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenAssignModal(student)}
                          className="text-xs px-2 py-1 rounded border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium"
                          title="Assign Fee"
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
          </table>
        </div>
      )}
 
      {/* ✅ Modal is now INSIDE the root <div className="p-6">, not after its closing tag */}
      {showAssignModal && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Assign Fee</h3>
              <p className="text-sm text-indigo-200">{selectedStudent.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programme</label>
                <p className="text-gray-900 font-medium">{selectedStudent.programme}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Amount (৳)
                </label>
                <input
                  type="number"
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter fee amount"
                />
              </div>
              {programmes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or select programme:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {programmes.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setCustomFee(p.feeAmount.toString())}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-indigo-100 rounded-full border"
                      >
                        {p.code} — ৳{p.feeAmount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 border rounded-lg px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignFee}
                className="flex-1 bg-indigo-600 text-white rounded-lg px-4 py-2"
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