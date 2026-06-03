const AllStudentList = () => {
  const STUDENTS_DATA = [
    {
      id: 1,
      studentId: "STU-2024-0001",
      fullName: "Rakib Hasan",
      email: "rakib.hasan@uni.edu",
      dateOfBirth: "2001-03-15",
      programmeId: "BSc-CSE",
      academicYear: "2023-24",
      status: "Active",
    },
    {
      id: 2,
      studentId: "STU-2024-0002",
      fullName: "Nusrat Jahan",
      email: "nusrat.jahan@uni.edu",
      dateOfBirth: "2000-11-22",
      programmeId: "BBA",
      academicYear: "2022-23",
      status: "Active",
    },
    {
      id: 3,
      studentId: "STU-2024-0003",
      fullName: "Tanvir Ahmed",
      email: "tanvir.ahmed@uni.edu",
      dateOfBirth: "1999-07-08",
      programmeId: "MSc-EEE",
      academicYear: "2021-22",
      status: "Graduated",
    },
    {
      id: 4,
      studentId: "STU-2024-0004",
      fullName: "Sadia Karim",
      email: "sadia.karim@uni.edu",
      dateOfBirth: "2002-01-30",
      programmeId: "BSc-CSE",
      academicYear: "2023-24",
      status: "Active",
    },
    {
      id: 5,
      studentId: "STU-2024-0005",
      fullName: "Faisal Rahman",
      email: "faisal.rahman@uni.edu",
      dateOfBirth: "2000-09-12",
      programmeId: "BSc-EEE",
      academicYear: "2022-23",
      status: "Suspended",
    },
    {
      id: 6,
      studentId: "STU-2024-0006",
      fullName: "Mst. Aklima Begum",
      email: "aklima.begum@uni.edu",
      dateOfBirth: "2001-12-05",
      programmeId: "MBA",
      academicYear: "2023-24",
      status: "Inactive",
    },
  ];
  // Status badge color mapping
  const getStatusStyles = (status) => {
    const styles = {
      Active: "bg-green-100 text-green-800 ring-green-600/20",
      Inactive: "bg-gray-100 text-gray-700 ring-gray-500/20",
      Graduated: "bg-blue-100 text-blue-800 ring-blue-600/20",
      Suspended: "bg-red-100 text-red-800 ring-red-600/20",
    };
    return styles[status];
  };
  return (
    <div>
      <div>
        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table Head */}
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:pl-6"
                  >
                    #
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    Student ID
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    Full Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    Date of Birth
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    Programme
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    Academic Year
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-200 bg-white">
                {STUDENTS_DATA.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
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
                            {student.fullName.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {student.fullName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                      {new Date(student.dateOfBirth).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                        {student.programmeId}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                      {student.academicYear}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyles(
                          student.status,
                        )}`}
                      >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {student.status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        type="button"
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State (if no data) */}
          {STUDENTS_DATA.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllStudentList;
