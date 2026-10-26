import React from "react";
import { useState } from "react";
// IMPORTING ICONS: Added BiChevronDown to handle the submenu visual indicator
import { BiChevronLeftCircle, BiChevronDown } from "react-icons/bi"; 
import { Search, LayoutDashboard, Boxes, ClipboardList, ChartColumnBig,
         Database, History, Settings, Warehouse, ListCheck, ShelvingUnit, Layers,
         Tag, UserGroup, Component, Truck, UserShield, BuildingComplex  } from 'lucide-react';
import { Link, usePage } from "@inertiajs/react";
import logo from "../img/logo.png";

export default function Sidebar() {
    
    // STATE: Tracks whether the sidebar layout is fully expanded (true) or collapsed (false)
    const [open, setOpen] = useState(true);
    
    // STATE: Stores the active array index of the currently open dropdown menu (null means all are closed)
    const [openDropdown, setOpenDropdown] = useState(null);

    // Contains the main navigational layout items
    // Nested dropdown nodes must contain 'submenu: true' and a defined 'submenuItems' array
    const SidebarMenus = [
        { 
            title: "Dashboard",
            icon: LayoutDashboard
        },
        {
            title: "Inventory", 
            icon: Boxes ,
            submenu: true, // Marker used to conditionally render dropdown behaviors and arrow indicators
            submenuItems: [
                { 
                    title: "Warehouse",
                    icon: Warehouse 
                },
                { 
                    title: "Property",
                    icon: BuildingComplex
                }
            ]
        },
        { 
            title: "Requisitions",
            icon: ClipboardList
        },
        { 
            title: "Reports",
            icon:  ChartColumnBig 
        },
        { 
            title: "Master Data",
            icon: Database,
            submenu: true,
            submenuItems: [
                { 
                    title: "Item Masterlists",
                    icon: ListCheck 
                },
                { 
                    title: "Asset Units",
                    icon: ShelvingUnit 
                },
                { 
                    title: "Categories",
                    icon: Layers 
                },
                { 
                    title: "Brands",
                    icon: Tag 
                },
                { 
                    title: "Models",
                    icon: Component 
                },
                { 
                    title: "Vendors & Suppliers",
                    icon: Truck 
                }
            ]
        },
        { 
            title: "Audit Trail",
            icon: History
        },
        { 
            title: "Settings",
            icon: Settings ,
            submenu: true,
            submenuItems: [
                { 
                    title: "Users",
                    icon: UserGroup 
                },
                { 
                    title: "Roles & Permissions",
                    icon: UserShield 
                },
                { 
                    title: "Property Assignments",
                    icon: BuildingComplex 
                },
            ]
        }
    ];

    /**
     * CONST FUNCTION REFERENCE: Handles the safe expansion/toggling of navigation dropdowns.
     * @param {number} index - The target loop index of the clicked menu item.
     */
    const handleDropdownToggle = (index) => {
        if (!open) {
            //If the sidebar is completely collapsed, open it first, then show the dropdown
            setOpen(true); 
            setOpenDropdown(index);
        } else {
            // Toggles active dropdown state: closes it if clicked again, otherwise loads the new index
            setOpenDropdown(openDropdown === index ? null : index);
        }
    };

  return (
    <>
        {/* VIEWPORT CONTROLLER: Uses select-none to prevent annoying highlight bugs on double clicks */}
        <div className="flex select-none">
            
            {/* MAIN SIDEBAR ENVELOPE: Dynamically alters width between 'w-72' and 'w-20' based on open state */}
            <div className={`bg-slate-900 border-r border-slate-800 text-slate-300 h-screen p-4 pt-8 ${open ? "w-72" : "w-20"} duration-300 relative flex flex-col justify-between shadow-xl`}>
                <div>
                    
                    {/* FLOATING ACTION SIDEBAR TOGGLE */}
                    <BiChevronLeftCircle 
                        className={`bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 shadow-md text-3xl rounded-full absolute -right-3.5 top-20 cursor-pointer duration-300 ${!open && "rotate-180"}`} 
                        onClick={() => {
                            setOpen(!open);
                            setOpenDropdown(null); // Cleanup Step: Closes active dropdown folders immediately when sidebar collapses
                        }} 
                    />

                    {/* BRANDING LOGO & COMPACT TEXT ENGINE */}
                    <div className={`flex flex-col items-center gap-3 px-2 duration-300 ${!open && "px-0"}`}>
                        <img 
                            src={logo} 
                            className={`block rounded-xl shadow-lg border border-slate-700/50 bg-slate-800/40 p-1.5 transition-all duration-500 origin-center ${
                                open ? "w-14 scale-100" : "w-10 scale-110"
                            }`} 
                        />
                        {/* Smoothly dissolves and shrinks typographic text nodes when sidebar is closed */}
                        <div className={`text-center transition-all duration-300 flex flex-col items-center ${!open && "scale-0 w-0 h-0 opacity-0 overflow-hidden"}`}>
                            <p className="text-sm text-slate-500">v1.0.0</p>
                            <h1 className="text-white font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                AssetPulse
                            </h1>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-widest whitespace-nowrap">
                                IT Inventory & Asset Management
                            </p>
                        </div>
                    </div>

                    {/* INTERACTIVE SEARCH COMPONENT MODULE */}
                    <div className={`flex items-center rounded-xl bg-slate-800/40 border border-slate-800/80 hover:border-slate-700 
                        focus-within:border-indigo-500 focus-within:bg-slate-800/80 mt-6 duration-200 
                        ${open ? "px-3.5 py-2.5" : "p-3.5 bg-transparent border-transparent"}`}>
                        <Search className="text-slate-400 w-5 h-5 shrink-0 cursor-pointer hover:text-white duration-200" onClick={() => !open && setOpen(true)} />
                        <input 
                            type="search" 
                            placeholder="Search..." 
                            className={`text-sm bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none ml-3 transition-all duration-300 ${
                                open ? "w-full opacity-100" : "w-0 opacity-0 pointer-events-none ml-0"
                            }`} 
                        />
                    </div>

                    {/* DYNAMIC LIST LAYER */}
                    <ul className="mt-6 space-y-1">
                        {SidebarMenus.map((menu, index) => {
                            // Create a clear reference helper to check if this specific dropdown is active
                            const isDropdownOpen = menu.submenu && openDropdown === index && open;

                            return (
                                <React.Fragment key={index}>
                                    
                                    {/* PARENT NAVIGATION LINK ITEM */}
                                    <li 
                                        onClick={() => menu.submenu && handleDropdownToggle(index)} 
                                        className={`flex items-center justify-between cursor-pointer p-3 text-sm font-medium rounded-xl transition-all duration-200 group hover:bg-slate-800/60 hover:text-white ${!open && "p-3"}`}
                                    >
                                        <div className="flex items-center gap-x-4">
                                        {/* Render Icon Dynamically from Menu Configuration Properties */}
                                            {menu.icon && (
                                                <menu.icon className="text-center w-5 h-5 shrink-0 text-slate-400 group-hover:text-white transition-colors duration-200" />
                                            )}
                                            <span className={`origin-left duration-300 transition-all ${!open ? "opacity-0 w-0 overflow-hidden scale-95" : "opacity-100 scale-100"}`}> 
                                               {menu.title} 
                                            </span>
                                        </div>

                                        {/* CONDITIONAL SUBMENU INDICATOR ARROW */}
                                        {menu.submenu && open && (
                                            <BiChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isDropdownOpen && "rotate-180"}`} />
                                        )}
                                        
                                        {/* HOVER TOOLTIP PORTAL */}
                                        {!open && (
                                            <div className="absolute left-full rounded-md px-3 py-1.5 ml-6 bg-slate-950 text-white text-xs font-semibold invisible opacity-0 -translate-x-3 
                                            transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 shadow-xl border border-slate-800 z-50 whitespace-nowrap 
                                            pointer-events-none">
                                                {menu.title} {menu.submenu && "(Contains Submenu)"}
                                            </div>
                                        )}
                                    </li>

                                    {/* NESTED CHILD SUBMENU CONTAINER: Handled purely via CSS layout toggles */}
                                    {menu.submenu && (
                                        <div 
                                            className={`grid transition-all duration-500 ease-in-out ${
                                                isDropdownOpen 
                                                    ? "grid-rows-[1fr] opacity-100 mt-1 mb-2" 
                                                    : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0 mb-0"
                                            }`}
                                        >
                                            {/* Crucial step: overflow-hidden hides child elements as height approaches 0fr */}
                                            <ul className="pl-6 space-y-1 overflow-hidden">
                                                {menu.submenuItems.map((subItem, subIndex) => (
                                                    <li 
                                                        key={subIndex} 
                                                        className="flex gap-2 text-slate-400 hover:text-white text-xs p-2.5 px-4 rounded-lg cursor-pointer hover:bg-slate-800/30 transition-all duration-150 transform hover:translate-x-1"
                                                    >   
                                                        {subItem.icon &&(
                                                            <subItem.icon className="w-4 h-4 text-slate-500 shrink-0 transition-colors" />
                                                        )}
                                                        <span>{subItem.title}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                </React.Fragment>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    </>
  );
}
