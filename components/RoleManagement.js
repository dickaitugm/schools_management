"use client";

import React, { useState, useEffect } from "react";

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        permissions: [],
    });

    // Mock data untuk permissions
    const mockPermissions = [
        { id: 1, name: "create_students", description: "Membuat data siswa" },
        { id: 2, name: "read_students", description: "Melihat data siswa" },
        { id: 3, name: "update_students", description: "Mengubah data siswa" },
        { id: 4, name: "delete_students", description: "Menghapus data siswa" },
        { id: 5, name: "create_teachers", description: "Membuat data guru" },
        { id: 6, name: "read_teachers", description: "Melihat data guru" },
        { id: 7, name: "update_teachers", description: "Mengubah data guru" },
        { id: 8, name: "delete_teachers", description: "Menghapus data guru" },
        { id: 9, name: "create_schools", description: "Membuat data sekolah" },
        { id: 10, name: "read_schools", description: "Melihat data sekolah" },
        { id: 11, name: "update_schools", description: "Mengubah data sekolah" },
        { id: 12, name: "delete_schools", description: "Menghapus data sekolah" },
        { id: 13, name: "create_schedules", description: "Membuat jadwal" },
        { id: 14, name: "read_schedules", description: "Melihat jadwal" },
        { id: 15, name: "update_schedules", description: "Mengubah jadwal" },
        { id: 16, name: "delete_schedules", description: "Menghapus jadwal" },
        { id: 17, name: "create_lessons", description: "Membuat pelajaran" },
        { id: 18, name: "read_lessons", description: "Melihat pelajaran" },
        { id: 19, name: "update_lessons", description: "Mengubah pelajaran" },
        { id: 20, name: "delete_lessons", description: "Menghapus pelajaran" },
        { id: 21, name: "manage_roles", description: "Mengelola roles dan permissions" },
        { id: 22, name: "view_reports", description: "Melihat laporan" },
        { id: 23, name: "view_assessments", description: "Melihat penilaian" },
        { id: 24, name: "create_assessments", description: "Membuat penilaian" },
    ];

    // Mock data untuk roles
    const mockRoles = [
        {
            id: 1,
            name: "admin",
            description: "Administrator dengan akses penuh",
            permissions: [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                24,
            ],
        },
        {
            id: 2,
            name: "teachers",
            description: "Guru dengan akses terbatas",
            permissions: [2, 6, 14, 18, 22, 23, 24],
        },
        {
            id: 3,
            name: "student",
            description: "Siswa dengan akses minimal",
            permissions: [14, 18, 23],
        },
        {
            id: 4,
            name: "parents",
            description: "Orang tua siswa",
            permissions: [2, 14, 23],
        },
        {
            id: 5,
            name: "guest",
            description: "Tamu dengan akses terbatas",
            permissions: [14, 18],
        },
    ];

    useEffect(() => {
        // Load data dari localStorage atau mock data
        const savedRoles = localStorage.getItem("roles");
        const savedPermissions = localStorage.getItem("permissions");

        if (savedRoles) {
            setRoles(JSON.parse(savedRoles));
        } else {
            setRoles(mockRoles);
            localStorage.setItem("roles", JSON.stringify(mockRoles));
        }

        if (savedPermissions) {
            setPermissions(JSON.parse(savedPermissions));
        } else {
            setPermissions(mockPermissions);
            localStorage.setItem("permissions", JSON.stringify(mockPermissions));
        }
    }, []);

    const handleCreate = () => {
        setEditingRole(null);
        setFormData({
            name: "",
            description: "",
            permissions: [],
        });
        setIsModalOpen(true);
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            permissions: role.permissions || [],
        });
        setIsModalOpen(true);
    };

    const handleDelete = (roleId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus role ini?")) {
            const updatedRoles = roles.filter((role) => role.id !== roleId);
            setRoles(updatedRoles);
            localStorage.setItem("roles", JSON.stringify(updatedRoles));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingRole) {
            // Update existing role
            const updatedRoles = roles.map((role) =>
                role.id === editingRole.id ? { ...role, ...formData } : role
            );
            setRoles(updatedRoles);
            localStorage.setItem("roles", JSON.stringify(updatedRoles));
        } else {
            // Create new role
            const newRole = {
                id: Date.now(),
                ...formData,
            };
            const updatedRoles = [...roles, newRole];
            setRoles(updatedRoles);
            localStorage.setItem("roles", JSON.stringify(updatedRoles));
        }

        setIsModalOpen(false);
        setFormData({ name: "", description: "", permissions: [] });
    };

    const handlePermissionChange = (permissionId) => {
        const updatedPermissions = formData.permissions.includes(permissionId)
            ? formData.permissions.filter((id) => id !== permissionId)
            : [...formData.permissions, permissionId];

        setFormData({ ...formData, permissions: updatedPermissions });
    };

    const getPermissionNames = (permissionIds) => {
        return permissionIds
            .map((id) => permissions.find((p) => p.id === id)?.name)
            .filter(Boolean)
            .join(", ");
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    BB for Society - Role and Permission Management
                </h1>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                    Tambah Role
                </button>
            </div>

            {/* Role List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Permissions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map((role) => (
                            <tr key={role.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {role.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">{role.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500 max-w-xs truncate">
                                        {getPermissionNames(role.permissions || [])}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(role)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for Create/Edit Role */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingRole ? "Edit Role" : "Tambah Role Baru"}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Role
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
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
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        required
                                    />
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
                                                        checked={formData.permissions.includes(
                                                            permission.id
                                                        )}
                                                        onChange={() =>
                                                            handlePermissionChange(permission.id)
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
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                                    >
                                        {editingRole ? "Update" : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
