"use client";

import { useState } from "react";
import AllStudentList from "./AllStudentList";
import NewStudent from "./NewStudent";
const Page = () => {
  const [newStudent, setNewStudent] = useState(false);

    return (
        <>
            <div className="max-w-7xl mx-auto min-h-screen bg-gray-50 p-6 md:p-10">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">👨‍🎓 Students</h1>
               <p className="mt-1 text-sm text-gray-600">
                Manage all enrolled students across programmes
              </p>
            </div>
            
            {
              !newStudent ? (
                <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors" onClick={() => setNewStudent(true)}>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
                  </svg>
                  Add New Student
                </button>
              ) : (
                <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors" onClick={() => setNewStudent(false)}>
                  All Sttudents
                </button>
              )
            }
          </div>
          {newStudent && <NewStudent />}
          {!newStudent && <AllStudentList  />}
        </div>
        </>
    );
};

export default Page;