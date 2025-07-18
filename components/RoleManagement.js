"use client";

import React, { useState, useEffect } from "react";

const RoleManagement = () => {
    // State untuk Users
    const [users, setUsers] = useState([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        username: "",
        email: "",
        password: "",
        name: "",
        role_id: "",
        is_active: true,
    });

    // State untuk Roles
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleFormData, setRoleFormData] = useState({
        name: "",
        description: "",
        permissions: [],
        is_active: true,
    });

    // Loading states
    const [loading, setLoading] = useState(true);
    const [userLoading, setUserLoading] = useState(false);
    const [roleLoading, setRoleLoading] = useState(false);

    // Delete confirmation modal states
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([loadUsers(), loadRoles(), loadPermissions()]);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await fetch("/api/users");
            const result = await response.json();
            if (result.success) {
                setUsers(result.data);
            } else {
                console.error("❌ Failed to load users:", result.error);
            }
        } catch (error) {
            console.error("❌ Error loading users:", error);
        }
    };

    const loadRoles = async () => {
        try {
            const response = await fetch("/api/roles?include_permissions=true");
            const result = await response.json();
            if (result.success) {
                setRoles(result.data);
            } else {
                console.error("❌ Failed to load roles:", result.error);
            }
        } catch (error) {
            console.error("❌ Error loading roles:", error);
        }
    };

    const loadPermissions = async () => {
        try {
            const response = await fetch("/api/permissions");
            const result = await response.json();
            if (result.success) {
                setPermissions(result.data);
            } else {
                console.error("❌ Failed to load permissions:", result.error);
            }
        } catch (error) {
            console.error("❌ Error loading permissions:", error);
        }
    };

    // === USER MANAGEMENT FUNCTIONS ===
    const handleCreateUser = () => {
        setEditingUser(null);
        setUserFormData({
            username: "",
            email: "",
            password: "",
            name: "",
            role_id: "",
            is_active: true,
        });
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        // Pastikan role_id tidak undefined
        setUserFormData({
            username: user.username,
            email: user.email,
            password: "", // Don't populate password for editing
            name: user.name,
            role_id: user.role_id || "", // Tambahkan fallback empty string jika undefined
            is_active: user.is_active !== undefined ? user.is_active : true,
        });
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        setDeleteConfirmation({
            show: true,
            type: 'user',
            item: user,
            title: 'Delete User',
            message: `Are you sure you want to delete user "${user.name}" (${user.username})?`,
            action: () => performDeleteUser(userId)
        });
    };

    const performDeleteUser = async (userId) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (result.success) {
                loadUsers();
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Gagal menghapus user");
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setUserLoading(true);

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
            const method = editingUser ? "PUT" : "POST";

            // Don't send empty password for updates
            const submitData = { ...userFormData };
            if (editingUser && !submitData.password) {
                delete submitData.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (result.success) {
                setIsUserModalOpen(false);
                setUserFormData({
                    username: "",
                    email: "",
                    password: "",
                    name: "",
                    role_id: "",
                    is_active: true,
                });
                loadUsers();
                // Show success message
                alert(`✅ User ${editingUser ? "berhasil diperbarui" : "berhasil dibuat"}!`);
            } else {
                alert("❌ Error: " + result.error);
            }
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Gagal menyimpan user");
        } finally {
            setUserLoading(false);
        }
    };

    // === ROLE MANAGEMENT FUNCTIONS ===
    const handleCreateRole = () => {
        setEditingRole(null);
        setRoleFormData({
            name: "",
            description: "",
            permissions: [],
            is_active: true,
        });
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleFormData({
            name: role.name,
            description: role.description,
            permissions: role.permissions || [],
            is_active: role.is_active !== false,
        });
        setIsRoleModalOpen(true);
    };

    const handleDeleteRole = async (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        
        setDeleteConfirmation({
            show: true,
            type: 'role',
            item: role,
            title: 'Delete Role',
            message: `Are you sure you want to delete role "${role.name}"?`,
            action: () => performDeleteRole(roleId)
        });
    };

    const performDeleteRole = async (roleId) => {
        try {
            const response = await fetch(`/api/roles/${roleId}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (result.success) {
                loadRoles();
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("Error deleting role:", error);
            alert("Gagal menghapus role");
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        setRoleLoading(true);

        try {
            const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
            const method = editingRole ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(roleFormData),
            });

            const result = await response.json();

            if (result.success) {
                setIsRoleModalOpen(false);
                setRoleFormData({
                    name: "",
                    description: "",
                    permissions: [],
                    is_active: true,
                });
                loadRoles();
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("Error saving role:", error);
            alert("Gagal menyimpan role");
        } finally {
            setRoleLoading(false);
        }
    };

    const handlePermissionChange = (permissionName) => {
        const updatedPermissions = roleFormData.permissions.includes(permissionName)
            ? roleFormData.permissions.filter((name) => name !== permissionName)
            : [...roleFormData.permissions, permissionName];

        setRoleFormData({ ...roleFormData, permissions: updatedPermissions });
    };

    const getPermissionNames = (permissionsList) => {
        if (!permissionsList || permissionsList.length === 0) return "No permissions";
        if (Array.isArray(permissionsList) && typeof permissionsList[0] === "string") {
            return permissionsList.join(", ");
        }
        if (Array.isArray(permissionsList) && typeof permissionsList[0] === "object") {
            return permissionsList.map((p) => p.name).join(", ");
        }
        return "No permissions";
    };

    const handleConfirmDelete = (confirmed) => {
        if (confirmed && deleteConfirmation?.action) {
            deleteConfirmation.action();
        }
        setDeleteConfirmation(null);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            {/* Header dengan instruksi */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">User & Role Management</h1>
                    <div className="text-sm text-gray-500">Kelola users dan roles sistem</div>
                </div>

                {/* Instruksi Penggunaan */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-blue-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Petunjuk:</strong> Kolom kiri untuk mengelola Users (CRUD),
                                kolom kanan untuk mengelola Roles dan Permissions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* LEFT COLUMN - USER MANAGEMENT */}
                <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="text-blue-500">👥</span>
                                User Management
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Kelola users dan assign roles
                            </p>
                        </div>
                        <button
                            onClick={handleCreateUser}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-md transition-all duration-200 hover:shadow-lg"
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Tambah User Baru
                        </button>
                    </div>

                    {/* User Management Instructions */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <svg
                                    className="w-5 h-5 text-blue-500 mt-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-blue-900 mb-1">
                                    Cara Mengelola Users:
                                </h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>
                                        • <strong>Tambah:</strong> Klik tombol "Tambah User Baru" di
                                        atas
                                    </li>
                                    <li>
                                        • <strong>Edit:</strong> Klik tombol "Edit" pada user yang
                                        ingin diubah
                                    </li>
                                    <li>
                                        • <strong>Hapus:</strong> Klik tombol "Delete" pada user
                                        yang ingin dihapus
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Status Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="text-gray-600">
                            📊 Status: <strong>{users.length} users</strong>,{" "}
                            <strong>{roles.length} roles</strong> tersedia
                        </p>
                        {users.length === 0 && (
                            <p className="text-blue-600 font-medium mt-2 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Belum ada user. Klik "Tambah User Baru" untuk menambahkan user
                                pertama!
                            </p>
                        )}
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-3 py-8 text-center text-gray-500"
                                        >
                                            <div className="flex flex-col items-center">
                                                <svg
                                                    className="w-12 h-12 mb-2 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                                    />
                                                </svg>
                                                <p className="text-sm text-gray-500">
                                                    No users found
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Click "Tambah User" to add your first user
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.filter(user => user && user.id).map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-3 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.username} • {user.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {user.role_name || "No Role"}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                                        user.is_active
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {user.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT COLUMN - ROLE MANAGEMENT */}
                <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-green-500">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="text-green-500">🛡️</span>
                                Role & Permission Management
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Kelola roles dan permissions
                            </p>
                        </div>
                        <button
                            onClick={handleCreateRole}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-md transition-all duration-200 hover:shadow-lg"
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Tambah Role Baru
                        </button>
                    </div>

                    {/* Roles Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role Name
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Permissions
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {roles.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-3 py-8 text-center text-gray-500"
                                        >
                                            <div className="flex flex-col items-center">
                                                <svg
                                                    className="w-12 h-12 mb-2 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                    />
                                                </svg>
                                                <p className="text-sm text-gray-500">
                                                    No roles found
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Click "Tambah Role" to add your first role
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    roles.filter(role => role && role.id).map((role) => (
                                        <tr key={role.id}>
                                            <td className="px-3 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {role.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {role.description}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                    {getPermissionNames(role.permissions || [])}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditRole(role)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* USER MODAL */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-xl rounded-lg bg-white">
                        <div className="mt-3">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-6 h-6 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {editingUser ? "Edit User" : "Tambah User Baru"}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {editingUser
                                            ? "Perbarui informasi user"
                                            : "Isi semua field untuk membuat user baru"}
                                    </p>
                                </div>
                            </div>

                            {/* Form Status */}
                            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-green-700 text-sm flex items-center gap-2">
                                    <svg
                                        className="w-4 h-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Mode: <strong>{editingUser ? "Edit" : "Create"}</strong> | Roles
                                    tersedia: <strong>{roles.length}</strong>
                                </p>
                            </div>

                            <form onSubmit={handleUserSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={userFormData.username}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                username: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={userFormData.email}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                email: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        value={userFormData.name}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password{" "}
                                        {editingUser && "(Kosongkan jika tidak ingin mengubah)"}
                                    </label>
                                    <input
                                        type="password"
                                        value={userFormData.password}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                password: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={!editingUser}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role *
                                    </label>
                                    <select
                                        value={userFormData.role_id}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                role_id: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Pilih Role</option>
                                        {roles.filter(role => role && role.id).map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name} - {role.description}
                                            </option>
                                        ))}
                                    </select>
                                    {roles.length === 0 && (
                                        <p className="text-red-500 text-xs mt-1">
                                            ⚠️ Tidak ada role tersedia. Tambahkan role terlebih
                                            dahulu.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={userFormData.is_active}
                                            onChange={(e) =>
                                                setUserFormData({
                                                    ...userFormData,
                                                    is_active: e.target.checked,
                                                })
                                            }
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-900">
                                            User Active
                                        </span>
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsUserModalOpen(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={userLoading || roles.length === 0}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        {userLoading ? (
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
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                                {editingUser ? "Update User" : "Buat User"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ROLE MODAL */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingRole ? "Edit Role" : "Tambah Role Baru"}
                            </h3>

                            <form onSubmit={handleRoleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Role
                                    </label>
                                    <input
                                        type="text"
                                        value={roleFormData.name}
                                        onChange={(e) =>
                                            setRoleFormData({
                                                ...roleFormData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        value={roleFormData.description}
                                        onChange={(e) =>
                                            setRoleFormData({
                                                ...roleFormData,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center mb-4">
                                        <input
                                            type="checkbox"
                                            checked={roleFormData.is_active}
                                            onChange={(e) =>
                                                setRoleFormData({
                                                    ...roleFormData,
                                                    is_active: e.target.checked,
                                                })
                                            }
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-900">
                                            Role Active
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Permissions
                                    </label>
                                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {permissions.map((permission) => (
                                                <label
                                                    key={permission.id}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permissions.includes(
                                                            permission.name
                                                        )}
                                                        onChange={() =>
                                                            handlePermissionChange(permission.name)
                                                        }
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">
                                                        <span className="font-medium">
                                                            {permission.name}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {" "}
                                                            - {permission.description}
                                                        </span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsRoleModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={roleLoading}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                                    >
                                        {roleLoading
                                            ? "Saving..."
                                            : editingRole
                                            ? "Update"
                                            : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation?.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl transform transition-all animate-pulse">
                        {/* Gradient Header */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {deleteConfirmation.title}
                                    </h3>
                                    <p className="text-red-100 text-sm opacity-90">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-5">
                            <div className="mb-4">
                                <p className="text-gray-700 text-base leading-relaxed">
                                    {deleteConfirmation.message}
                                </p>
                                
                                {deleteConfirmation.item && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {deleteConfirmation.type === 'user' ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    )}
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">
                                                    {deleteConfirmation.type === 'user' ? deleteConfirmation.item.name : deleteConfirmation.item.name}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {deleteConfirmation.type === 'user' 
                                                        ? `Username: ${deleteConfirmation.item.username} | Email: ${deleteConfirmation.item.email}`
                                                        : deleteConfirmation.item.description || 'No description'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleConfirmDelete(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleConfirmDelete(true)}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                >
                                    Delete {deleteConfirmation.type === 'user' ? 'User' : 'Role'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
