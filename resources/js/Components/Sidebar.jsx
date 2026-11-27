import React, { useState, useEffect, useCallback } from "react";
import { BiChevronLeftCircle, BiChevronDown } from "react-icons/bi";
import {
    LayoutDashboard, Boxes, ClipboardList, ChartColumnBig,
    Database, History, Settings, Warehouse, ListCheck, ShelvingUnit, Layers,
    Tag, UserGroup, Component, Truck, UserShield, BuildingComplex, Plus,
    Eye, MapPin, Barcode, Tags, ArrowLeftRight, Repeat
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import logo from "../img/logo.png";

// Sidebar navigation structure with top-level links, dropdowns, and nested submenus
const SIDEBAR_MENUS = [
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
            {
                title: "Warehouse",
                icon: Warehouse,
                submenu: true,
                submenuItems: [
                    { title: "Central Stock Monitor", icon: Eye, href: "/inventory/warehouse" },
                    { title: "Warehouse Stock In", icon: Plus, href: "/inventory/warehousestockin" }
                ]
            },
            {
                title: "Property Inventory",
                icon: BuildingComplex,
                submenu: true,
                submenuItems: [
                    { title: "Property Stock Monitor", icon: Eye, href: "/inventory/propertyinventory" },
                    { title: "Property Stock In", icon: Plus, href: "/inventory/propertystockin" }
                ]
            },
            {
                title: "Transactions",
                icon: ArrowLeftRight,
                submenu: true,
                submenuItems: [
                    { title: "Deployments", icon: MapPin, href: "/inventory/deployments" },
                    { title: "Borrowing", icon: Repeat, href: "/inventory/borrowing" }
                ]
            }
        ]
    },
    {
        title: "Requisitions",
        icon: ClipboardList,
        submenu: true,
        submenuItems: [
            { title: "Requisitions", icon: ClipboardList, href: "/requisitions/index" },
            { title: "Show Requisition", icon: Eye, href: "/requisitions/show" },
            { title: "Create Requisition", icon: Plus, href: "/requisitions/create" }
        ]
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
            { title: "Asset Units", icon: ShelvingUnit, href: "/master-data/assetunits" },
            { title: "SKUs", icon: Barcode, href: "/master-data/skus" },
            { title: "Unit of Measures", icon: Tags, href: "/master-data/unitofmeasures" },
            { title: "Categories", icon: Layers, href: "/master-data/categories" },
            { title: "Brands", icon: Tag, href: "/master-data/brands" },
            { title: "Models", icon: Component, href: "/master-data/models" },
            { title: "Vendors & Suppliers", icon: Truck, href: "/master-data/suppliers" },
            { title: "Locations", icon: MapPin, href: "/master-data/locations" }
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
            { title: "Roles & Permissions", icon: UserShield, href: "/settings/rolesandpermissions" },
            { title: "Property Assignments", icon: BuildingComplex, href: "/settings/properties" },
        ]
    }
];

// Strip query strings/hashes so route matching stays accurate on filtered URLs
function normalizePath(urlOrHref = "") {
    return String(urlOrHref).split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
}

// Match current path either exactly or as a sub-path segment (e.g. /requisitions/show/1)
function isRouteActive(currentPath, href) {
    if (!href) return false;
    const cleanCurrent = normalizePath(currentPath);
    const cleanHref = normalizePath(href);
    return cleanCurrent === cleanHref || cleanCurrent.startsWith(`${cleanHref}/`);
}

// Check if a second-level submenu group contains the active route
function hasActiveNestedRoute(subItem, currentPath) {
    if (!subItem?.submenu || !Array.isArray(subItem.submenuItems)) return false;
    return subItem.submenuItems.some((nested) => isRouteActive(currentPath, nested.href));
}

// Find the top-level and nested menu indices matching the current URL
function getActiveMenuIndices(currentUrl) {
    let activeMain = null;
    let activeSub = null;

    SIDEBAR_MENUS.forEach((menu, index) => {
        if (!menu.submenu || !Array.isArray(menu.submenuItems)) return;

        menu.submenuItems.forEach((subItem, subIndex) => {
            if (subItem.submenu && Array.isArray(subItem.submenuItems)) {
                if (hasActiveNestedRoute(subItem, currentUrl)) {
                    activeMain = index;
                    activeSub = subIndex;
                }
            } else if (isRouteActive(currentUrl, subItem.href)) {
                activeMain = index;
            }
        });
    });

    return { activeMain, activeSub };
}

// Return true when any child or nested route matches the current URL
function hasActiveChildRoute(menu, currentUrl) {
    if (!menu.submenu || !Array.isArray(menu.submenuItems)) return false;

    return menu.submenuItems.some((subItem) => {
        if (isRouteActive(currentUrl, subItem.href)) return true;
        return hasActiveNestedRoute(subItem, currentUrl);
    });
}

// Collapsible left sidebar with smooth dropdown animations and instant active-route highlighting
export default function Sidebar() {
    const { url, props } = usePage();
    const { auth } = props;
    const currentUser = auth?.user;
    const currentIp = props.client_ip;
    const appVersion = props?.appVersion || "v1.0.0";

    // True when expanded (w-72), false when collapsed to compact rail (w-20)
    const [open, setOpen] = useState(true);
    // Stores open top-level dropdown indices so active route menus stay visible
    const [openDropdowns, setOpenDropdowns] = useState(() => {
        const { activeMain } = getActiveMenuIndices(url);
        return activeMain !== null ? [activeMain] : [];
    });
    // Stores the active second-level nested submenu index
    const [openSubDropdown, setOpenSubDropdown] = useState(() => {
        const { activeSub } = getActiveMenuIndices(url);
        return activeSub;
    });

    // Keep the active route's menu and nested submenu expanded on navigation
    const syncActiveRouteMenus = useCallback(() => {
        const { activeMain, activeSub } = getActiveMenuIndices(url);

        setOpenDropdowns((prev) => {
            if (activeMain === null || prev.includes(activeMain)) return prev;
            return [...prev, activeMain];
        });

        setOpenSubDropdown((prev) => (activeSub !== null ? activeSub : prev));
    }, [url]);

    // Sync active menus whenever the Inertia URL changes
    useEffect(() => {
        syncActiveRouteMenus();
    }, [syncActiveRouteMenus]);

    // Toggle a top-level dropdown while preserving the active route's dropdown
    const handleDropdownToggle = (index) => {
        const { activeMain, activeSub } = getActiveMenuIndices(url);

        if (!open) {
            setOpen(true);
            setOpenDropdowns(
                activeMain !== null && activeMain !== index ? [activeMain, index] : [index]
            );
            setOpenSubDropdown(index === activeMain ? activeSub : null);
            return;
        }

        setOpenDropdowns((prev) => {
            const isAlreadyOpen = prev.includes(index);

            // Keep the active route's parent menu open so active links stay accessible
            if (isAlreadyOpen && index === activeMain) {
                return prev;
            }

            if (isAlreadyOpen) {
                return prev.filter((item) => item !== index);
            }

            // Keep active menu open alongside the newly clicked menu
            return activeMain !== null && activeMain !== index
                ? [activeMain, index]
                : [index];
        });

        if (index !== activeMain) {
            setOpenSubDropdown(null);
        }
    };

    // Toggle a second-level submenu (like Warehouse) without collapsing its parent dropdown
    const handleSubDropdownToggle = (subIndex, e) => {
        e.stopPropagation();
        setOpenSubDropdown(openSubDropdown === subIndex ? null : subIndex);
    };

    return (
        <div className="flex select-none">
            {/* Fixed viewport height with flex-col keeps the bottom security footer visible */}
            <div
                className={`bg-slate-900 border-r border-slate-800 text-slate-300 h-screen overflow-hidden ${
                    open ? "w-72" : "w-20"
                } transition-[width] duration-200 relative flex flex-col justify-between shadow-xl`}
            >
                {/* Sidebar expand/collapse toggle aligned cleanly on the right border */}
                <BiChevronLeftCircle
                    className={`bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 shadow-md text-3xl rounded-full fixed top-16 ${
                        open ? "left-[274px]" : "left-[66px]"
                    } z-40 cursor-pointer transition-[left,transform,color,border-color] duration-200 ${!open && "rotate-180"}`}
                    onClick={() => {
                        const nextOpen = !open;
                        setOpen(nextOpen);
                        if (nextOpen) {
                            syncActiveRouteMenus();
                        } else {
                            setOpenDropdowns([]);
                            setOpenSubDropdown(null);
                        }
                    }}
                />

                {/* Scrollable menu area with balanced spacing below the brand block */}
                <div className="sidebar-scroll flex-1 min-h-0 overflow-y-auto px-3.5 pt-5 pb-2">
                    {/* Brand logo, version label, and system title */}
                    <div className={`flex flex-col items-center gap-1.5 px-2 ${!open && "px-0"}`}>
                        <img
                            src={logo}
                            alt="Logo"
                            className={`block rounded-xl shadow-lg border border-slate-700/50 bg-slate-800/40 p-1 origin-center ${
                                open ? "w-11 scale-100" : "w-9 scale-150"
                            }`}
                        />
                        <div className={`text-center flex flex-col items-center ${!open && "hidden"}`}>
                            <p className="text-[11px] leading-tight text-slate-500">{appVersion}</p>
                            <h1 className="font-bold text-base leading-snug tracking-wider text-indigo-400">
                                AssetPulse
                            </h1>
                            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest whitespace-nowrap">
                                IT Inventory &amp; Asset Management
                            </p>
                        </div>
                    </div>

                    {/* Top-level navigation list */}
                    <ul className="mt-6 space-y-1">
                        {SIDEBAR_MENUS.map((menu, index) => {
                            const isDropdownOpen = menu.submenu && openDropdowns.includes(index) && open;
                            const isParentActive = menu.href
                                ? isRouteActive(url, menu.href)
                                : hasActiveChildRoute(menu, url);

                            return (
                                <React.Fragment key={menu.title}>
                                    {menu.submenu ? (
                                        // Expandable parent menu item
                                        <li
                                            onClick={() => handleDropdownToggle(index)}
                                            className={`relative flex items-center justify-between cursor-pointer px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-100 group hover:bg-slate-800/60 hover:text-white ${
                                                isParentActive ? "bg-slate-800/80 text-white" : "text-slate-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-x-3.5 min-w-0">
                                                {menu.icon && (
                                                    <menu.icon className={`w-5 h-5 shrink-0 transition-colors duration-100 ${
                                                        isParentActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white"
                                                    }`} />
                                                )}
                                                <span className={`truncate ${!open ? "hidden" : "block"}`}>
                                                    {menu.title}
                                                </span>
                                            </div>

                                            {open && (
                                                <BiChevronDown className={`w-5 h-5 shrink-0 text-slate-400 transition-transform duration-150 ${isDropdownOpen && "rotate-180"}`} />
                                            )}

                                            {/* Tooltip shown when sidebar is collapsed */}
                                            {!open && (
                                                <div className="fixed left-20 rounded-md px-3 py-1.5 ml-3 bg-slate-950 text-white text-xs font-semibold invisible opacity-0 -translate-x-2
                                                transition-[opacity,transform,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 shadow-xl border border-slate-800 z-50 whitespace-nowrap pointer-events-none">
                                                    {menu.title}
                                                </div>
                                            )}
                                        </li>
                                    ) : (
                                        // Direct navigation link with immediate active styling
                                        <li className="relative group">
                                            <Link
                                                href={menu.href}
                                                preserveScroll
                                                className={`flex items-center gap-x-3.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-100 hover:bg-slate-800/60 hover:text-white ${
                                                    isParentActive
                                                        ? "bg-indigo-600/20 text-indigo-400 font-semibold border-l-2 border-indigo-400"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {menu.icon && (
                                                    <menu.icon className={`w-5 h-5 shrink-0 transition-colors duration-100 ${isParentActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white"}`} />
                                                )}
                                                <span className={`truncate ${!open ? "hidden" : "block"}`}>
                                                    {menu.title}
                                                </span>
                                            </Link>

                                            {/* Tooltip shown when sidebar is collapsed */}
                                            {!open && (
                                                <div className="fixed left-20 rounded-md px-3 py-1.5 ml-3 bg-slate-950 text-white text-xs font-semibold invisible opacity-0 -translate-x-2
                                                transition-[opacity,transform,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 shadow-xl border border-slate-800 z-50 whitespace-nowrap pointer-events-none">
                                                    {menu.title}
                                                </div>
                                            )}
                                        </li>
                                    )}

                                    {/* First-level submenu container with smooth height/opacity transition */}
                                    {menu.submenu && (
                                        <div
                                            className={`grid transition-[grid-template-rows,opacity,margin] duration-150 ease-out ${
                                                isDropdownOpen
                                                    ? "grid-rows-[1fr] opacity-100 mt-0.5 mb-0.5"
                                                    : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0 mb-0"
                                            }`}
                                        >
                                            <ul className="pl-5 space-y-0.5 overflow-hidden">
                                                {menu.submenuItems.map((subItem, subIndex) => {
                                                    const isSubActive = isRouteActive(url, subItem.href);
                                                    const isNestedGroupActive = hasActiveNestedRoute(subItem, url);
                                                    const isSubDropdownOpen = subItem.submenu && openSubDropdown === subIndex;

                                                    return (
                                                        <li key={subItem.title}>
                                                            {subItem.submenu ? (
                                                                // Nested dropdown parent (Warehouse / Property Inventory / Transactions)
                                                                <div>
                                                                    <div
                                                                        onClick={(e) => handleSubDropdownToggle(subIndex, e)}
                                                                        className={`flex items-center justify-between gap-2 text-xs py-1.5 px-3 rounded-lg cursor-pointer transition-colors duration-100 ${
                                                                            isNestedGroupActive
                                                                                ? "text-slate-200 font-semibold bg-slate-800/40"
                                                                                : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            {subItem.icon && (
                                                                                <subItem.icon className={`w-4 h-4 shrink-0 ${isNestedGroupActive ? "text-indigo-400" : "text-slate-500"}`} />
                                                                            )}
                                                                            <span className="truncate">{subItem.title}</span>
                                                                        </div>
                                                                        <BiChevronDown className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-150 ${isSubDropdownOpen && "rotate-180"}`} />
                                                                    </div>

                                                                    {/* Second-level nested links with smooth collapse/expand */}
                                                                    <div
                                                                        className={`grid transition-[grid-template-rows,opacity,margin] duration-150 ease-out ${
                                                                            isSubDropdownOpen
                                                                                ? "grid-rows-[1fr] opacity-100 mt-0.5"
                                                                                : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
                                                                        }`}
                                                                    >
                                                                        <ul className="pl-3 space-y-0.5 overflow-hidden border-l border-slate-800 ml-3">
                                                                            {subItem.submenuItems.map((nestedItem) => {
                                                                                const isNestedActive = isRouteActive(url, nestedItem.href);
                                                                                return (
                                                                                    <li key={nestedItem.href}>
                                                                                        <Link
                                                                                            href={nestedItem.href}
                                                                                            preserveScroll
                                                                                            className={`flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg cursor-pointer transition-colors duration-100 ${
                                                                                                isNestedActive
                                                                                                    ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                                                                                                    : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                                                                                            }`}
                                                                                        >
                                                                                            {nestedItem.icon && (
                                                                                                <nestedItem.icon className={`w-3.5 h-3.5 shrink-0 ${isNestedActive ? "text-indigo-400" : "text-slate-500"}`} />
                                                                                            )}
                                                                                            <span className="truncate">{nestedItem.title}</span>
                                                                                        </Link>
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // Standard submenu link
                                                                <Link
                                                                    href={subItem.href}
                                                                    preserveScroll
                                                                    className={`flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg cursor-pointer transition-colors duration-100 ${
                                                                        isSubActive
                                                                            ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                                                                            : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                                                                    }`}
                                                                >
                                                                    {subItem.icon && (
                                                                        <subItem.icon className={`w-4 h-4 shrink-0 transition-colors duration-100 ${isSubActive ? "text-indigo-400" : "text-slate-500"}`} />
                                                                    )}
                                                                    <span className="truncate">{subItem.title}</span>
                                                                </Link>
                                                            )}
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

                {/* Pinned bottom security audit footer showing login time and IP metadata */}
                {currentUser && (
                    <div className={`shrink-0 border-t border-slate-800 bg-slate-900 px-4 py-2 ${!open && "flex justify-center px-2"}`}>
                        <div className={`${!open && "hidden"}`}>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tight truncate">
                                <span className="text-slate-300 font-semibold font-sans uppercase tracking-wider block text-[9px]">Security Audit</span>
                                Last login: {currentUser.last_login_at ? new Date(currentUser.last_login_at).toLocaleString("en-US", {
                                    timeZone: "Asia/Manila",
                                    dateStyle: "short",
                                    timeStyle: "short"
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