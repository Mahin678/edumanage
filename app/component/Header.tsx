import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EDU</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">
                EduManage
                </span>
            </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6">
            <Link
                href="/dashboard/staff/assessments"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
                assessments
            </Link>
            <Link
                href="/dashboard/staff/assingment"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
                assignments
            </Link>
            <Link
                href="/dashboard/staff/marksheet"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
                marksheet
            </Link>
            <Link
                href="/dashboard/staff/payment"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
                payment
            </Link>
            <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
                student List
            </Link>
            <Link
                href="/dashboard/staff/programmes"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
                Promgramme List
            </Link>
            </nav>

            {/* Right side - User/Actions */}
            <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
                </svg>
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
            </div>
            </div>
        </div>
        </div>
    </header>
  );
}