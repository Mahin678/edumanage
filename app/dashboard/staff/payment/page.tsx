// app/(staff)/fees/page.tsx
"use client"

import { useEffect, useState } from "react"

type PaymentStatus = "Completed" | "Overdue" | "Due"

type Student = {
  id: string,
  studentId: string,
  name: string
  email?: string
  programmeId?: string
  programme?: string
  status?: string
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
  studentId: string,
  id: string
  name: string
  email?: string
  dateOfBirth?: string
  programmeId?: string
  academicYear?: string
  status?: string,
  halfDueDate: string | null
  halfPaidDate: string | null
  halfReferenceNo: string | null
  fullDueDate: string | null
  fullPaidDate: string | null
  fullReferenceNo: string | null
}

function getStatus(student: Student): PaymentStatus {
  const now = new Date()

  const halfOverdue = !student.halfPaidDate && new Date(student.halfDueDate) < now
  const fullOverdue = !student.fullPaidDate && new Date(student.fullDueDate) < now

  if (halfOverdue || fullOverdue) return "Overdue"

  const bothPaid = !!student.halfPaidDate && !!student.fullPaidDate
  if (bothPaid) return "Completed"

  return "Due"
}

const statusStyles: Record<PaymentStatus, string> = {
  Completed: "bg-green-100 text-green-800",
  Overdue: "bg-red-100 text-red-800",
  Due: "bg-yellow-100 text-yellow-800",
}

export default function FeesPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  // ✅ Step 1: Fetch students from API on mount
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
          // Transform API data to match Student type and filter by Enrolled status
         const transformedStudents: Student[] = data.data
            .filter((student: ApiStudent) => student.status === "Enrolled")
            .map((student: ApiStudent) => ({
              id: student.id,                              // DB cuid (for React keys)
              studentId: student.studentId,                 // human-readable ID (for API URLs)
              name: student.name || "",
              email: student.email || "",
              programmeId: student.programmeId || "",
              programme: student.programmeId || "",
              status: student.status || "",
              halfDueDate: student.halfDueDate ?? "",
              halfPaidDate: student.halfPaidDate ?? "",
              halfReferenceNo: student.halfReferenceNo ?? "",
              fullDueDate: student.fullDueDate ?? "",
              fullPaidDate: student.fullPaidDate ?? "",
              fullReferenceNo: student.fullReferenceNo ?? "",
            }));
          
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
  }, [])

  // ✅ Step 2: Handle field changes
  function handleChange(
    id: string,
    field: keyof Student,
    value: string
  ) {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value || null } : s))
    )
  }

  // ✅ Step 3: Save payment data to database
  async function handleSave(studentStudentId: string) {
  const student = students.find((s) => s.studentId === studentStudentId)
  if (!student) return

  setSavingId(studentStudentId)

  try {
    const response = await fetch(`/api/students/${student.studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        halfDueDate: student.halfDueDate || null,
        halfPaidDate: student.halfPaidDate || null,
        halfReferenceNo: student.halfReferenceNo || null,
        fullDueDate: student.fullDueDate || null,
        fullPaidDate: student.fullPaidDate || null,
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
    <div className="p-6">
      <h1 className="text-xl font-medium mb-6">Fees and Payments</h1>

      {/* ✅ Notification message */}
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
                <th className="px-4 py-3 text-left">Student ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Programme</th>
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
                const status = getStatus(student)
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {student.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                    <td className="px-4 py-3 text-gray-500">{student.programme}</td>

                    {/* <td className="px-4 py-3 text-gray-500">{student.halfDueDate}</td> */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={student.halfPaidDate?.split("T")[0] || ""}
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

                    {/* <td className="px-4 py-3 text-gray-500">{student.fullDueDate}</td> */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={student.fullPaidDate?.split("T")[0] || ""}
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
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSave(student.studentId)}
                        disabled={savingId === student.studentId}
                        className="text-xs px-3 py-1 rounded border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingId === student.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}