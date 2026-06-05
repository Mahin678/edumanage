// app/dashboard/staff/student/NewStudent.jsx
"use client";

import { useEffect, useRef, useState } from "react";

const PROGRAMMES = [
  { value: "", label: "-- Select Programme --" },
  { value: "BSc-CSE", label: "BSc in Computer Science & Engineering" },
  { value: "BSc-EEE", label: "BSc in Electrical & Electronic Engineering" },
  { value: "BBA", label: "Bachelor of Business Administration" },
  { value: "MBA", label: "Master of Business Administration" },
  { value: "MSc-CSE", label: "MSc in Computer Science & Engineering" },
  { value: "MSc-EEE", label: "MSc in Electrical & Electronic Engineering" },
];

const STATUSES = [
  { value: "", label: "-- Select Status --" },
  { value: "Enrolled", label: "📝 Enrolled" },
  { value: "Deferred", label: "⏳ Deferred" },
  { value: "Withdrawn", label: "🚪 Withdrawn" },
  { value: "Completed", label: "🎓 Completed" },
];

const ACADEMIC_YEARS = [
  { value: "", label: "-- Select Academic Year --" },
  { value: "2024-25", label: "2024-25" },
  { value: "2023-24", label: "2023-24" },
  { value: "2022-23", label: "2022-23" },
  { value: "2021-22", label: "2021-22" },
  { value: "2020-21", label: "2020-21" },
];

type StudentFormData = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  programmeId: string;
  academicYear: string;
  status: string;
};

type Notification = {
  type: "success" | "error";
  title: string;
  message?: string;
  studentId?: string;
  id: number; // for animation re-trigger
};

const INITIAL_FORM: StudentFormData = {
  fullName: "",
  email: "",
  dateOfBirth: "",
  programmeId: "",
  academicYear: "",
  status: "",
};

function buildStudentPayload(form: StudentFormData) {
  return {
    fullName: form.fullName,
    email: form.email,
    dateOfBirth: form.dateOfBirth || undefined,
    programmeId: form.programmeId || undefined,
    academicYear: form.academicYear || undefined,
    status: form.status || undefined,
  };
}

export default function NewStudent() {
  const isMountedRef = useRef(true);
  const fullNameRef = useRef<HTMLInputElement>(null);

  // ✅ DECLARE STATE FIRST before using it in useEffect
  const [formData, setFormData] = useState<StudentFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  // ✅ Now use state in effects
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Auto-dismiss notifications after 4 seconds (success) or 5 seconds (error)
  useEffect(() => {
    if (!notification) return;
    
    const delay = notification.type === "success" ? 4000 : 5000;
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setNotification(null);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [notification]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Name must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 16 || age > 100) {
        newErrors.dateOfBirth = "Student must be between 16 and 100 years old";
      }
    }

    if (!formData.programmeId) newErrors.programmeId = "Please select a programme";
    if (!formData.academicYear) newErrors.academicYear = "Please select academic year";
    if (!formData.status) newErrors.status = "Please select a status";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // setNotification(null);

    if (!validate()) {
      setNotification({
        type: "error",
        id: Date.now(),
        title: "Please fix the errors above",
      });
      return;
    }

    setIsSubmitting(true);

    // Capture the name BEFORE we reset the form
    const submittedName = formData.fullName.trim();

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildStudentPayload(formData)),
      });

      const data = await response.json();
      // console.log("[NewStudent] API response:", response.status, data);
      if(response.status === 201) {
          setNotification({
          type: "success",
          id: Date.now(),
          title: "Student created successfully!",
          message: `${submittedName} has been added to the system.`,
        });
        setIsSubmitting(false);
        setFormData(INITIAL_FORM);
        setErrors({});
        fullNameRef.current?.focus();
        return;
      }

      if (!response.ok) {
        const message =
          data?.message ??
          data?.error ??
          (response.status === 409
            ? "A student with this email already exists"
            : response.status === 400
            ? "Please check the form for errors"
            : "Failed to create student");
        throw new Error(message);
      }

      const newStudentId = data?.data?.studentId ?? "";

      if (isMountedRef.current) {
        // ✅ Reset form FIRST
        setFormData(INITIAL_FORM);
        setErrors({});
        setIsSubmitting(false);

        // ✅ Then show success notification (with the captured name)
        setNotification({
          type: "success",
          id: Date.now(),
          title: "Student created successfully!",
          message: `${submittedName} has been added to the system.`,
          studentId: newStudentId,
        });

        // ✅ Focus the first input so the user can immediately type the next one
        setTimeout(() => {
          fullNameRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error("[NewStudent] Submit error:", error);
      if (isMountedRef.current) {
        setIsSubmitting(false);
        const errorMessage =
          error instanceof Error ? error.message : "An unexpected error occurred";
        setNotification({
          type: "error",
          id: Date.now(),
          title: "Failed to create student",
          message: errorMessage,
        });
      }
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setNotification(null);
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  const inputClass = (fieldName: string) => {
    const hasError = Boolean(errors[fieldName]);
    return `block w-full rounded-lg border ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
    } bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
      `}</style>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">➕ Add New Student</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the information below to register a new student. A unique
            student ID will be generated automatically.
          </p>
        </div>

        {/* ✅ Simple inline notification message */}
        {notification && (
          <div
            key={notification.id}
            role="alert"
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              notification.type === "success"
                ? "bg-green-100 border-green-500 text-green-800"
                : "bg-red-100 border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-bold text-lg">{notification.title}</p>
                {notification.message && (
                  <p className="text-sm mt-1">{notification.message}</p>
                )}
                {notification.studentId && (
                  <p className="text-sm font-mono mt-2 bg-white/50 p-2 rounded inline-block">
                    ID: <strong>{notification.studentId}</strong>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={dismissNotification}
                className="text-xl font-bold hover:opacity-70"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
            <h2 className="text-lg font-semibold text-white">Student Information</h2>
            <p className="text-sm text-indigo-100 mt-1">
              All fields marked with <span className="text-yellow-300">*</span> are required
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fullNameRef}
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g., Rakib Hasan"
                  className={inputClass("fullName")}
                />
                {errors.fullName && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@uni.edu"
                  className={inputClass("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={inputClass("dateOfBirth")}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="programmeId"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Programme <span className="text-red-500">*</span>
                </label>
                <select
                  id="programmeId"
                  name="programmeId"
                  value={formData.programmeId}
                  onChange={handleChange}
                  className={inputClass("programmeId")}
                >
                  {PROGRAMMES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {errors.programmeId && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.programmeId}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="academicYear"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className={inputClass("academicYear")}
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
                {errors.academicYear && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.academicYear}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClass("status")}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.status}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-500 hover:to-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
                  </svg>
                  Add Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
