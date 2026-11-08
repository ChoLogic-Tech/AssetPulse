import React, { useState, useRef, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  User,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function Navbar({ pageTitle, user }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  //Grab the auth object from Inertia's usePage hook
  const { auth } = usePage().props || {};
  
  // Safely fallback user properties
  const currentUser = user || auth?.user;

  // Safe initials generator even if name is missing
  const userName = currentUser.username || "User";
  const userFullName = [currentUser.fname, currentUser.lname].filter(Boolean).join(" ") || "John Doe";
  const userInitials = userFullName
    .split(" ")
    .map((n) => n?.[0] || "")
    .join("")
    .toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Dynamic Title / Breadcrumb Header */}
      <div className="flex items-center space-x-2 text-xl font-bold tracking-tight">
        {Array.isArray(pageTitle) ? (
          pageTitle.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="w-5 h-5 text-slate-400 stroke-[2.5]" />
              )}
              <span
                className={
                  index === pageTitle.length - 1
                    ? "text-slate-800 text-sm"
                    : "text-slate-500 text-sm"
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))
        ) : (
          <h1 className="text-xl font-bold text-slate-800">{pageTitle}</h1>
        )}
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications Button */}
        {/* <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button> */}

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
                {userInitials}
              </div>
            )}

            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-800 leading-tight">
                {userName}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {currentUser.role_name}
              </span>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {userFullName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser.email || "No email provided"}
                </p>
                <p className="text-xs text-slate-500">
                  {currentUser.property_name}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 mr-3 text-slate-400" />
                  Your Profile
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3 text-slate-400" />
                  Account Settings
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1">
                <Link
                  href="/logout"
                  method="post"
                  as="button"
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 mr-3 text-red-500" />
                  Log Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}