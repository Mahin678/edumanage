
// type Student = {
//   id: number;
//   studentId: string;
//   name: string;
//   email: string;
//   dateOfBirth: string;
//   programmeId: string;
//   academicYear: string;
//   status: "Active" | "Inactive" | "Graduated" | "Suspended" | string;
// };

import { Student } from "./AllStudentList";

type ClearFiltersProps = {
  setSearch: (value: string) => void;
  setProgrammeFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  search: string;
  programmeFilter: string;
  programmes: Array<string>;
  statuses: Array<string>;
  statusFilter: string;
  filteredStudents: Array<Student>;
  studentData: Student[]
};


const StudentFilter = ({ setSearch, setProgrammeFilter, setStatusFilter, search, programmeFilter, programmes, statusFilter, statuses, filteredStudents, studentData }:ClearFiltersProps ) => {
  const clearFilters = (  ) => {
    setSearch("");
    setProgrammeFilter("all");
    setStatusFilter("all");
  };
    return (
        <>
         {/* Search & Filter Bar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label
              htmlFor="search"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, programme, or status..."
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Programme Filter */}
          <div>
            <label
              htmlFor="programme"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Programme
            </label>
            <select
              id="programme"
              value={programmeFilter}
              onChange={(e) => setProgrammeFilter(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Programmes</option>
              {programmes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result count + clear */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {filteredStudents.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {studentData.length}
            </span>{" "}
            students
          </span>
          {(search || programmeFilter !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
        </>
    );
};

export default StudentFilter;