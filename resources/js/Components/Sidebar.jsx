import React, { useState, useEffect } from "react";
import { BiChevronLeftCircle, BiChevronDown } from "react-icons/bi"; 
import { Search, LayoutDashboard, Boxes, ClipboardList, ChartColumnBig,
    Database, History, Settings, Warehouse, ListCheck, ShelvingUnit, Layers,
    Tag, UserGroup, Component, Truck, UserShield, BuildingComplex  } from 'lucide-react';
import { Link, usePage } from "@inertiajs/react";
import logo from "../img/logo.png";

export default function Sidebar() {
    const { url, props } = usePage(); // 1. Pull props from Inertia
    const { auth } = props;           // 2. Extract auth object
    const currentUser = auth?.user;   // 3. Get the logged-in user details
    const currentIp = props.client_ip; //4. Read directly from props for the current IP address

    // STATE: Tracks whether the sidebar layout is fully expanded (true) or collapsed (false)
    const [open, setOpen] = useState(true);
    
    // STATE: Stores the active array index of the currently open dropdown menu
    const [openDropdown, setOpenDropdown] = useState(null);

    // SidebarMenus array remains the same...
    const SidebarMenus = [
        { 
            title: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard"
        },
        {
            title: "Inventory", 
            icon: Boxes,
            submenu: true,
            submenuItems: [
                { title: "Warehouse", icon: Warehouse, href: "/inventory/warehouse" },
                { title: "Property", icon: BuildingComplex, href: "/inventory/property" }
            ]
        },
        { 
            title: "Requisitions",
            icon: ClipboardList,
            href: "/requisitions"
        },
        { 
            title: "Reports",
            icon: ChartColumnBig,
            href: "/reports"
        },
        { 
            title: "Master Data",
            icon: Database,
            submenu: true,
            submenuItems: [
                { title: "Item Masterlists", icon: ListCheck, href: "/master-data/itemmaster" },
                { title: "Asset Units", icon: ShelvingUnit, href: "/master-data/asset-units" },
                { title: "Categories", icon: Layers, href: "/master-data/categories" },
                { title: "Brands", icon: Tag, href: "/master-data/brands" },
                { title: "Models", icon: Component, href: "/master-data/models" },
                { title: "Vendors & Suppliers", icon: Truck, href: "/master-data/vendors" }
            ]
        },
        { 
            title: "Audit Trail",
            icon: History,
            href: "/audit-trail"
        },
        { 
            title: "Settings",
            icon: Settings,
            submenu: true,
            submenuItems: [
                { title: "Users", icon: UserGroup, href: "/settings/users" },
                { title: "Roles & Permissions", icon: UserShield, href: "/settings/roles" },
                { title: "Property Assignments", icon: BuildingComplex, href: "/settings/assignments" },
            ]
        }
    ];

    useEffect(() => {
        SidebarMenus.forEach((menu, index) => {
            if (menu.submenu && menu.submenuItems.some(sub => url.startsWith(sub.href))) {
                setOpenDropdown(index);
            }
        });
    }, [url]);

    const handleDropdownToggle = (index) => {
        if (!open) {
            setOpen(true); 
            setOpenDropdown(index);
        } else {
            setOpenDropdown(openDropdown === index ? null : index);
        }
    };

    return (
        <div className="flex select-none">
            <div className={`bg-slate-900 border-r border-slate-800 text-slate-300 h-screen p-4 pt-8 ${open ? "w-72" : "w-20"} duration-300 relative flex flex-col justify-between shadow-xl`}>
                <div>
                    {/* FLOATING ACTION SIDEBAR TOGGLE */}
                    <BiChevronLeftCircle 
                        className={`bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 shadow-md text-3xl rounded-full absolute -right-3.5 top-20 cursor-pointer duration-300 ${!open && "rotate-180"}`} 
                        onClick={() => {
                            setOpen(!open);
                            setOpenDropdown(null); 
                        }} 
                    />

                    {/* BRANDING LOGO */}
                    <div className={`flex flex-col items-center gap-3 px-2 duration-300 ${!open && "px-0"}`}>
                        <img 
                            src={logo} 
                            alt="Logo"
                            className={`block rounded-xl shadow-lg border border-slate-700/50 bg-slate-800/40 p-1.5 transition-all duration-500 origin-center ${
                                open ? "w-14 scale-100" : "w-10 scale-200"
                            }`} 
                        />
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

                    {/* SEARCH MODULE */}
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
                            const isDropdownOpen = menu.submenu && openDropdown === index && open;
                            const isParentActive = menu.href && url.startsWith(menu.href);

                            return (
                                <React.Fragment key={index}>
                                    {menu.submenu ? (
                                        // DROPDOWN PARENT ITEM
                                        <li 
                                            onClick={() => handleDropdownToggle(index)} 
                                            className={`flex items-center justify-between cursor-pointer p-3 text-sm font-medium rounded-xl transition-all duration-200 group hover:bg-slate-800/60 hover:text-white`}
                                        >
                                            <div className="flex items-center gap-x-4">
                                                {menu.icon && (
                                                    <menu.icon className="text-center w-5 h-5 shrink-0 text-slate-400 group-hover:text-white transition-colors duration-200" />
                                                )}
                                                <span className={`origin-left duration-300 transition-all ${!open ? "opacity-0 w-0 overflow-hidden scale-95" : "opacity-100 scale-100"}`}> 
                                                   {menu.title} 
                                                </span>
                                            </div>

                                            {open && (
                                                <BiChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isDropdownOpen && "rotate-180"}`} />
                                            )}

                                            {!open && (
                                                <div className="absolute left-full rounded-md px-3 py-1.5 ml-6 bg-slate-950 text-white text-xs font-semibold invisible opacity-0 -translate-x-3 
                                                transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 shadow-xl border border-slate-800 z-50 whitespace-nowrap pointer-events-none">
                                                    {menu.title}
                                                </div>
                                            )}
                                        </li>
                                    ) : (
                                        // STANDARD LINK ITEM (e.g. Dashboard, Requisitions)
                                        <li>
                                            <Link 
                                                href={menu.href}
                                                className={`flex items-center gap-x-4 p-3 text-sm font-medium rounded-xl transition-all duration-200 group hover:bg-slate-800/60 hover:text-white ${
                                                    isParentActive ? "bg-indigo-600/20 text-indigo-400 font-semibold" : "text-slate-300"
                                                }`}
                                            >
                                                {menu.icon && (
                                                    <menu.icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isParentActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white"}`} />
                                                )}
                                                <span className={`origin-left duration-300 transition-all ${!open ? "opacity-0 w-0 overflow-hidden scale-95" : "opacity-100 scale-100"}`}> 
                                                   {menu.title} 
                                                </span>
                                            </Link>

                                            {!open && (
                                                <div className="absolute left-full rounded-md px-3 py-1.5 ml-6 bg-slate-950 text-white text-xs font-semibold invisible opacity-0 -translate-x-3 
                                                transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 shadow-xl border border-slate-800 z-50 whitespace-nowrap pointer-events-none">
                                                    {menu.title}
                                                </div>
                                            )}
                                        </li>
                                    )}

                                    {/* NESTED CHILD SUBMENU CONTAINER */}
                                    {menu.submenu && (
                                        <div 
                                            className={`grid transition-all duration-500 ease-in-out ${
                                                isDropdownOpen 
                                                    ? "grid-rows-[1fr] opacity-100 mt-1 mb-2" 
                                                    : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0 mb-0"
                                            }`}
                                        >
                                            <ul className="pl-6 space-y-1 overflow-hidden">
                                                {menu.submenuItems.map((subItem, subIndex) => {
                                                    const isSubActive = url === subItem.href;

                                                    return (
                                                        <li key={subIndex}>
                                                            <Link 
                                                                href={subItem.href}
                                                                className={`flex gap-2 text-xs p-2.5 px-4 rounded-lg cursor-pointer transition-all duration-150 transform hover:translate-x-1 ${
                                                                    isSubActive 
                                                                        ? "bg-indigo-600/20 text-indigo-400 font-semibold" 
                                                                        : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                                                                }`}
                                                            >   
                                                                {subItem.icon && (
                                                                    <subItem.icon className={`w-4 h-4 shrink-0 transition-colors ${isSubActive ? "text-indigo-400" : "text-slate-500"}`} />
                                                                )}
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </ul>
                </div>

                {/* BOTTOM SECTION: SECURE LAST LOGIN TIMESTAMP ONLY */}
                {currentUser && (
                    <div className={`border-t border-slate-800/80 p-2 mt-auto transition-all duration-300 ${!open && "flex justify-center"}`}>
                        <div className={`mt-4 overflow-hidden transition-all duration-300 ${!open && "scale-0 w-0 opacity-0 overflow-hidden"}`}>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tight truncate">
                                <span className="text-slate-500 font-semibold font-sans uppercase tracking-wider block text-[9px]">Security Audit</span>
                                Last login: {currentUser.last_login_at ? new Date(currentUser.last_login_at).toLocaleString('en-US', { 
                                    timeZone: 'Asia/Manila',
                                    dateStyle: 'short', 
                                    timeStyle: 'short' 
                                }) : "First login"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tight truncate">
                                Last login IP: {currentUser.last_login_ip ? currentUser.last_login_ip : "Null"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tight truncate">
                                Current IP: {currentIp}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}