import React from "react";
import { useState } from "react";
import { BiChevronLeftCircle } from "react-icons/bi";
import { Search } from 'lucide-react';
import { Link, usePage } from "@inertiajs/react";
import logo from "../img/logo.png";

export default function Sidebar() {
    
    const [open, setOpen] = useState(true);

    // Track which dropdown index is open (null means none)
    const [openDropdown, setOpenDropdown] = useState(null);

    const SidebarMenus = [
        {title: "Dashboard"},
        {
            title: "Inventory",
            submenu: true,
            submenuItems: [
                {title: "Warehouse"},
                {title: "Property"}
            ]
        },
        {title: "Requisitions"},
        {title: "Reports"},
        {title: "Master Data"},
        {title: "Audit Trail"},
        {title: "Settings"}
    ]

  return (
    <>
        <div className="flex select-none">
            <div className={`bg-slate-900 border-r border-slate-800 text-slate-300 h-screen p-4 pt-8 ${open ? "w-72" : "w-20"} duration-300 relative flex flex-col justify-between shadow-xl`}>
                <div>
                    {/* Floating Toggle Button */}
                    <BiChevronLeftCircle 
                        className={`bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 shadow-md text-3xl rounded-full absolute -right-3.5 top-9 cursor-pointer duration-300 ${!open && "rotate-180"}`} 
                        onClick={() => setOpen(!open)} 
                    />

                    {/* Logo & Header Section */}
                    <div className={`flex flex-col items-center gap-3 px-2 duration-300 ${!open && "px-0"}`}>
                        <img 
                            src={logo} 
                            className={`block rounded-xl shadow-lg border border-slate-700/50 bg-slate-800/40 p-1.5 transition-all duration-500 origin-center ${
                                open ? "w-14 scale-100" : "w-10 scale-150"
                            }`} 
                        />
                        
                        <div className={`text-center transition-all duration-300 flex flex-col items-center ${!open && "scale-0 w-0 h-0 opacity-0 overflow-hidden"}`}>
                            <h1 className="text-white font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                AssetPulse
                            </h1>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-widest whitespace-nowrap">
                                IT Inventory & Asset Management
                            </p>
                        </div>
                    </div>

                    {/* Search Bar Layout */}
                    <div className={`flex items-center rounded-xl bg-slate-800/40 border border-slate-800/80 hover:border-slate-700 focus-within:border-indigo-500 focus-within:bg-slate-800/80 mt-6 duration-200 ${open ? "px-3.5 py-2.5" : "p-3.5"}`}>
                        <Search className="text-slate-400 w-5 h-5 shrink-0 cursor-pointer hover:text-white duration-200" onClick={() => !open && setOpen(true)} />

                        <input 
                            type="search" 
                            placeholder="Search..." 
                            className={`text-sm bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none ml-3 transition-all duration-300 ${
                                open ? "w-full opacity-100" : "w-0 opacity-0 pointer-events-none ml-0"
                            }`} 
                        />
                    </div>

                    {/* Navigation Menu Links */}
                    <ul className="mt-6 space-y-1">
                        {SidebarMenus.map((menu, index) => (
                            <React.Fragment key={index}>
                                <li className={`flex items-center gap-x-4 cursor-pointer p-3 text-sm font-medium rounded-xl transition-all duration-200 group hover:bg-slate-800/60 hover:text-white ${!open && "justify-center p-3"}`}>
                                    <span className={`origin-left duration-300 transition-all ${!open ? "opacity-0 w-0 overflow-hidden scale-95" : "opacity-100 scale-100"}`}> 
                                        {menu.title} 
                                    </span>
                                    
                                    {/* Tooltip hint when the sidebar is collapsed */}
                                    {!open && (
                                        <div className="absolute left-full rounded-md px-3 py-1.5 ml-6 bg-slate-950 text-white text-xs font-semibold invisible opacity-0 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 shadow-xl border border-slate-800 z-50 whitespace-nowrap pointer-events-none">
                                            {menu.title}
                                        </div>
                                    )}
                                </li>
                            </React.Fragment>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </>
  );
}
