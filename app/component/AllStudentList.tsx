import { useEffect, useMemo, useState } from "react";
import StudentFilter from "./StudentFilter";

export type Student = {
  _id?: string;       // MongoDB ObjectId (optional)
  id?: string | number; // Prisma CUID or numeric ID (optional)
  studentId: string;  // e.g. "STU-2024-0001"
  name: string;
  email: string;
  dateOfBirth: string; // ISO date string
  programmeId: string;
  academicYear: string;
    status: "Active" | "Inactive" | "Graduated" | "Suspended" | string;
};
const AllStudentList = () => {
  const [studentData, setStudentData] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("/api/students", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (data.success) {
          setStudentData(data?.data);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  // Status badge color mapping
  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      Active: "bg-green-100 text-green-800 ring-green-600/20",
      Inactive: "bg-gray-100 text-gray-700 ring-gray-500/20",
      Graduated: "bg-blue-100 text-blue-800 ring-blue-600/20",
      Suspended: "bg-red-100 text-red-800 ring-red-600/20",
    };
    return styles[status] || "bg-gray-100 text-gray-700 ring-gray-500/20";
  };

  // Get unique programmes
  const programmes = useMemo(() => {
    const set = new Set(studentData.map((s) => s.programmeId));
    return Array.from(set);
  }, [studentData]);

  // Get unique statuses
  const statuses = useMemo(() => {
    const set = new Set(studentData.map((s) => s.status));
    return Array.from(set);
  }, [studentData]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    const q = search?.trim().toLowerCase();
    return studentData.filter((student) => {
      const matchesSearch =
        q === "" ||
        student.name?.toLowerCase().includes(q) ||
        student.studentId?.toLowerCase().includes(q) ||
        student.programmeId?.toLowerCase().includes(q) ||
        student.status?.toLowerCase().includes(q);

      const matchesProgramme =
        programmeFilter === "all" || student.programmeId === programmeFilter;

      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;

      return matchesSearch && matchesProgramme && matchesStatus;
    });
  }, [studentData, search, programmeFilter, statusFilter]);

  // Helper to get a unique key for a student
  const getStudentKey = (s: Student) => s._id || s.id?.toString() || s.studentId;

  // Delete handler
  const handleDelete = async (student: Student) => {
    const key = getStudentKey(student);
    setDeletingId(key);

    try {
      const response = await fetch(`/api/students/${student._id || student.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setStudentData((prev) =>
          prev.filter((s) => getStudentKey(s) !== key)
        );
        setConfirmId(null);
      } else {
        alert(data.message || "Failed to delete student");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <StudentFilter
        setSearch={setSearch}
        setProgrammeFilter={setProgrammeFilter}
        setStatusFilter={setStatusFilter}
        search={search}
        programmeFilter={programmeFilter}
        programmes={programmes}
        statusFilter={statusFilter}
        statuses={statuses}
        filteredStudents={filteredStudents}
        studentData={studentData}
      />

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:pl-6">#</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Student ID</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Full Name</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Email</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Date of Birth</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Programme</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Academic Year</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="whitespace-nowrap py-12 text-center text-sm text-gray-500">
                    {studentData.length === 0
                      ? "No students found or loading..."
                      : "No students match your filters."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const key = getStudentKey(student);
                  const isDeleting = deletingId === key;
                  const isConfirming = confirmId === key;

                  return (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-500 sm:pl-6">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-mono font-semibold text-indigo-600">
                        {student.studentId}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex items-center">
                          <div className="h-9 w-9 flex-shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                              {student.name?.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">{student.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                        {new Date(student.dateOfBirth).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                          {student.programmeId}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">{student.academicYear}</td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyles(
                            student.status
                          )}`}
                        >
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                          {student.status}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {isConfirming ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">Are you sure?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(student)}
                              disabled={isDeleting}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {isDeleting ? "Deleting..." : "Yes"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              disabled={isDeleting}
                              className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(key)}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllStudentList;
