// app/(staff)/fees/page.tsx
"use client"

import { useState } from "react"

type PaymentStatus = "Completed" | "Overdue" | "Due"

type Student = {
  id: string
  name: string
  programme: string
  halfDueDate: string
  halfPaidDate: string | null
  halfReferenceNo: string | null
  fullDueDate: string
  fullPaidDate: string | null
  fullReferenceNo: string | null
}

const initialData: Student[] = [
  {
    id: "SMS-2025-0001",
    name: "Rakib Hasan",
    programme: "BSc Computer Science",
    halfDueDate: "2025-01-31",
    halfPaidDate: "2025-01-28",
    halfReferenceNo: "PAY-001",
    fullDueDate: "2025-03-31",
    fullPaidDate: null,
    fullReferenceNo: null,
  },
  {
    id: "SMS-2025-0002",
    name: "Fatema Akter",
    programme: "BA Business Admin",
    halfDueDate: "2025-01-31",
    halfPaidDate: null,
    halfReferenceNo: null,
    fullDueDate: "2025-03-31",
    fullPaidDate: null,
    fullReferenceNo: null,
  },
  {
    id: "SMS-2025-0003",
    name: "Tanvir Ahmed",
    programme: "BSc Computer Science",
    halfDueDate: "2025-01-31",
    halfPaidDate: "2025-02-05",
    halfReferenceNo: "PAY-003",
    fullDueDate: "2025-03-31",
    fullPaidDate: "2025-03-25",
    fullReferenceNo: "PAY-004",
  },
  {
    id: "SMS-2025-0004",
    name: "Nusrat Jahan",
    programme: "BA Business Admin",
    halfDueDate: "2025-01-31",
    halfPaidDate: null,
    halfReferenceNo: null,
    fullDueDate: "2025-03-31",
    fullPaidDate: null,
    fullReferenceNo: null,
  },
  {
    id: "SMS-2025-0005",
    name: "Mehedi Hasan",
    programme: "BSc Computer Science",
    halfDueDate: "2025-01-31",
    halfPaidDate: "2025-01-20",
    halfReferenceNo: "PAY-005",
    fullDueDate: "2025-03-31",
    fullPaidDate: null,
    fullReferenceNo: null,
  },
]

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
  const [students, setStudents] = useState<Student[]>(initialData)

  function handleChange(
    id: string,
    field: keyof Student,
    value: string
  ) {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value || null } : s))
    )
  }

  function handleSave(id: string) {
    const student = students.find((s) => s.id === id)
    console.log("Saved:", student)
    alert(`${id} সংরক্ষণ হয়েছে`)
  }

  return (
    <div className="p-6 ">
      <h1 className="text-xl font-medium mb-6">Fees and Payments</h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Student ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Programme</th>
              <th className="px-4 py-3 text-left">Half Due</th>
              <th className="px-4 py-3 text-left">Half Paid</th>
              <th className="px-4 py-3 text-left">Half Ref No</th>
              <th className="px-4 py-3 text-left">Full Due</th>
              <th className="px-4 py-3 text-left">Full Paid</th>
              <th className="px-4 py-3 text-left">Full Ref No</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left"></th>
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
                  <td className="px-4 py-3 text-gray-500">{student.programme}</td>

                  <td className="px-4 py-3 text-gray-500">{student.halfDueDate}</td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={student.halfPaidDate ?? ""}
                      onChange={(e) => handleChange(student.id, "halfPaidDate", e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={student.halfReferenceNo ?? ""}
                      placeholder="PAY-XXX"
                      onChange={(e) => handleChange(student.id, "halfReferenceNo", e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs w-24"
                    />
                  </td>

                  <td className="px-4 py-3 text-gray-500">{student.fullDueDate}</td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={student.fullPaidDate ?? ""}
                      onChange={(e) => handleChange(student.id, "fullPaidDate", e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={student.fullReferenceNo ?? ""}
                      placeholder="PAY-XXX"
                      onChange={(e) => handleChange(student.id, "fullReferenceNo", e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs w-24"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
                      {status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSave(student.id)}
                      className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}