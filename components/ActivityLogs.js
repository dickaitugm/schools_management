"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [filters, setFilters] = useState({
        role: "all",
        action: "all",
        dateFrom: "",
        dateTo: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [logsPerPage] = useState(20);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteDays, setDeleteDays] = useState(30);

    const { logActivity } = useAuth();

    useEffect(() => {
        // Load activity logs from database
        fetchActivityLogs();

        // Log page access
        logActivity("page_access", "Accessed Activity Logs page");
    }, [filters, currentPage]);

    const fetchActivityLogs = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: currentPage,
                limit: logsPerPage,
                ...(filters.role !== "all" && { role: filters.role }),
                ...(filters.action !== "all" && { action: filters.action }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo }),
            });

            const response = await fetch(`/api/activity-logs?${params}`);

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setLogs(result.data);
                    setPagination(result.pagination);
                } else {
                    console.error("Failed to fetch activity logs:", result.error);
                    setLogs([]);
                }
            } else {
                console.error("Failed to fetch activity logs:", response.statusText);
                setLogs([]);
            }
        } catch (error) {
            console.error("Error fetching activity logs:", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterName, value) => {
        setFilters((prev) => ({
            ...prev,
            [filterName]: value,
        }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const clearFilters = () => {
        setFilters({
            role: "all",
            action: "all",
            dateFrom: "",
            dateTo: "",
        });
        setCurrentPage(1);
    };

    const exportLogs = async () => {
        try {
            // Fetch all logs for export (without pagination)
            const params = new URLSearchParams({
                limit: 10000, // Large number to get all logs
                page: 1,
                ...(filters.role !== "all" && { role: filters.role }),
                ...(filters.action !== "all" && { action: filters.action }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo }),
            });

            const response = await fetch(`/api/activity-logs?${params}`);

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const csvContent = convertToCSV(result.data);
                    downloadCSV(csvContent, "activity-logs.csv");
                    logActivity("export", "Exported activity logs to CSV");
                }
            }
        } catch (error) {
            console.error("Error exporting logs:", error);
        }
    };

    const deleteLogs = async () => {
        try {
            setDeleteLoading(true);

            const response = await fetch(`/api/activity-logs?daysToKeep=${deleteDays}`, {
                method: "DELETE",
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Delete result:", result);

                // Log the deletion activity
                logActivity("delete", `Deleted old activity logs (kept last ${deleteDays} days)`, {
                    deletedCount: result.deletedCount,
                });

                // Refresh the logs
                fetchActivityLogs();
                setShowDeleteModal(false);

                // Show success message
                alert(`Successfully deleted ${result.deletedCount} old activity logs`);
            } else {
                const error = await response.json();
                console.error("Delete error:", error);
                alert("Failed to delete logs: " + error.error);
            }
        } catch (error) {
            console.error("Error deleting logs:", error);
            alert("Error deleting logs: " + error.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Pagination
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Calculate display values for pagination
    const startItem = (pagination.currentPage - 1) * logsPerPage + 1;
    const endItem = Math.min(pagination.currentPage * logsPerPage, pagination.totalRecords);
    const totalPages = pagination.totalPages;

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getActionColor = (action) => {
        const colors = {
            login: "bg-green-100 text-green-800",
            logout: "bg-red-100 text-red-800",
            create: "bg-blue-100 text-blue-800",
            update: "bg-yellow-100 text-yellow-800",
            delete: "bg-red-100 text-red-800",
            view: "bg-gray-100 text-gray-800",
            export: "bg-purple-100 text-purple-800",
            page_access: "bg-indigo-100 text-indigo-800",
        };
        return colors[action] || "bg-gray-100 text-gray-800";
    };

    const getRoleColor = (role) => {
        const colors = {
            admin: "bg-red-100 text-red-800",
            teachers: "bg-blue-100 text-blue-800",
            parents: "bg-green-100 text-green-800",
            student: "bg-purple-100 text-purple-800",
            guest: "bg-gray-100 text-gray-800",
        };
        return colors[role] || "bg-gray-100 text-gray-800";
    };

    const convertToCSV = (data) => {
        const headers = [
            "ID",
            "Timestamp",
            "User ID",
            "User Name",
            "Role",
            "Action",
            "Description",
            "IP Address",
            "User Agent",
            "Session ID",
        ];
        const csvRows = [headers.join(",")];

        data.forEach((log) => {
            const row = [
                log.id,
                formatTimestamp(log.created_at),
                log.user_id,
                `"${log.user_name}"`,
                log.user_role,
                log.action,
                `"${log.description}"`,
                log.ip_address || "N/A",
                `"${(log.user_agent || "N/A").replace(/"/g, '""')}"`,
                log.session_id || "N/A",
            ];
            csvRows.push(row.join(","));
        });

        return csvRows.join("\n");
    };

    const downloadCSV = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-4 text-lg">Loading activity logs...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">BB for Society - Activity Logs</h1>
                <div className="flex gap-2">
                    <button
                        onClick={exportLogs}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
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
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                        Clean Old Logs
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            value={filters.role}
                            onChange={(e) => handleFilterChange("role", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="teachers">Teachers</option>
                            <option value="parents">Parents</option>
                            <option value="student">Student</option>
                            <option value="guest">Guest</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Action
                        </label>
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange("action", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Actions</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="view">View</option>
                            <option value="export">Export</option>
                            <option value="page_access">Page Access</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Session
                        </label>
                        <select
                            value={filters.session}
                            onChange={(e) => handleFilterChange("session", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Sessions</option>
                            <option value="guest">Guest</option>
                            <option value="authenticated">Authenticated</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Total Records</h3>
                    <p className="text-2xl font-bold text-gray-900">{pagination.totalRecords}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Current Page Results</h3>
                    <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Unique Users</h3>
                    <p className="text-2xl font-bold text-green-600">
                        {new Set(logs.map((log) => log.user_id)).size}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Current Page</h3>
                    <p className="text-2xl font-bold text-purple-600">
                        {pagination.currentPage} / {pagination.totalPages}
                    </p>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    IP Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Session
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatTimestamp(log.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {log.user_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                                                log.user_role
                                            )}`}
                                        >
                                            {log.user_role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
                                                log.action
                                            )}`}
                                        >
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                        {log.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {log.ip_address || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {log.session_id ? "🔐 Auth" : "🌐 Anonymous"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => paginate(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrevPage}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => paginate(pagination.currentPage + 1)}
                                disabled={!pagination.hasNextPage}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{startItem}</span> to{" "}
                                    <span className="font-medium">{endItem}</span> of{" "}
                                    <span className="font-medium">{pagination.totalRecords}</span>{" "}
                                    results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => paginate(pagination.currentPage - 1)}
                                        disabled={!pagination.hasPrevPage}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(Math.min(10, pagination.totalPages))].map(
                                        (_, index) => {
                                            const pageNumber = index + 1;
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => paginate(pageNumber)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        pagination.currentPage === pageNumber
                                                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        }
                                    )}
                                    <button
                                        onClick={() => paginate(pagination.currentPage + 1)}
                                        disabled={!pagination.hasNextPage}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center mb-4">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg
                                    className="h-6 w-6 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                                Clean Old Activity Logs
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                This will permanently delete activity logs older than the specified
                                number of days. Make sure to export logs for backup before
                                proceeding.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Keep logs from last (days):
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={deleteDays}
                                    onChange={(e) => setDeleteDays(parseInt(e.target.value) || 30)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteLogs}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteLoading ? "Deleting..." : "Delete Old Logs"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;
