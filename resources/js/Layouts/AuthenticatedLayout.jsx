import React, { useEffect } from "react";
import Sidebar from "@/Components/Sidebar";
import Navbar from "@/Components/Navbar"; // Import the new Navbar component
import { Toaster } from 'sonner'; // Import Sonner Toaster (Notification like sweetalert)

export default function AuthenticatedLayout({ user, pageTitle, children }) {

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <Navbar user={user} pageTitle={pageTitle} />

        {/* Page Content */}
        <main className="p-6 flex-1">
          {children}
        </main>

        {/* Global Sonner Toaster positioned at the bottom right */}
        <Toaster
          position="bottom-right"
          rigchColors
          expand={true}
          />
      </div>
    </div>
  );
}