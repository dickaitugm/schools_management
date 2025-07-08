"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const Sidebar = ({ currentPage, onPageChange, collapsed = false, onToggle }) => {
    const [isMobile, setIsMobile] = useState(false);
    const { user, hasPermission, logout, isGuest } = useAuth();

    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
        };

        // Check on mount
        checkScreenSize();

        // Listen for resize
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    const allMenuItems = [
        { path: "dashboard", name: "Dashboard", icon: "📊", permission: null },
        { path: "schools", name: "Schools", icon: "🏫", permission: "read_schools" },
        { path: "teachers", name: "Teachers", icon: "👨‍🏫", permission: "read_teachers" },
        { path: "students", name: "Students", icon: "👨‍🎓", permission: "read_students" },
        { path: "lessons", name: "Lessons", icon: "📚", permission: "read_lessons" },
        { path: "schedules", name: "Schedules", icon: "📅", permission: "read_schedules" },
        { path: "cash-flow", name: "Donations", icon: "💰", permission: "read_cash_flow" },
        { path: "roles", name: "Role Management", icon: "⚙️", permission: "manage_roles" },
        { path: "activity-logs", name: "Activity Logs", icon: "📝", permission: "manage_roles" },
    ];

    // Filter menu items based on user permissions
    const menuItems = allMenuItems.filter((item) => {
        if (!item.permission) return true; // Dashboard is always accessible
        return hasPermission(item.permission);
    });

    const toggleSidebar = () => {
        if (onToggle) {
            onToggle(!collapsed);
        }
    };

    const handleMenuClick = (path) => {
        onPageChange(path);
        // Auto-close sidebar on mobile after selecting menu
        if (isMobile && onToggle) {
            onToggle(true);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && !collapsed && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => onToggle && onToggle(true)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
          bg-blue-800 text-white transition-all duration-300 ease-in-out flex flex-col
          ${isMobile ? "fixed z-50 h-full shadow-lg" : "relative"} 
          ${collapsed ? (isMobile ? "w-64" : "w-16") : "w-64"}
        `}
                style={{
                    left: isMobile ? (collapsed ? "-256px" : "0px") : "auto",
                    position: isMobile ? "fixed" : "relative",
                }}
            >
                {/* Header */}
                <div className="p-4 border-b border-blue-700">
                    <div className="flex items-center justify-between">
                        {!collapsed && (
                            <div>
                                <h1 className="text-lg font-bold">BB for Society</h1>
                                {user && (
                                    <div className="text-xs text-blue-200 mt-1">
                                        {user.name} ({user.role})
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {collapsed ? (
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
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            ) : (
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 flex-1">
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <button
                                    onClick={() => handleMenuClick(item.path)}
                                    className={`
                    flex items-center p-3 rounded-lg transition-colors w-full text-left group
                    ${currentPage === item.path ? "bg-blue-600" : "hover:bg-blue-700"}
                    ${collapsed ? "justify-center" : "space-x-3"}
                  `}
                                    title={collapsed ? item.name : ""}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    {!collapsed && <span className="truncate">{item.name}</span>}

                                    {/* Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                                            {item.name}
                                        </div>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Info & Login/Logout */}
                {!collapsed && (
                    <div className="p-4 border-t border-blue-700">
                        {isGuest ? (
                            <button
                                onClick={() => handleMenuClick("login")}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-700 transition-colors w-full text-left"
                            >
                                <span className="text-xl">🔑</span>
                                <span className="truncate">Login</span>
                            </button>
                        ) : (
                            <button
                                onClick={logout}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-700 transition-colors w-full text-left"
                            >
                                <span className="text-xl">🚪</span>
                                <span className="truncate">Logout</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default Sidebar;
