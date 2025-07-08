"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useAuth } from "./AuthContext";

const CashFlowManagement = () => {
    const { hasPermission, logActivity, user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [schools, setSchools] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        type: "",
        category: "",
        account: "",
        school_id: "",
        status: "confirmed",
        date_from: "",
        date_to: "",
        search: "",
        page: 1,
        period: "all", // Changed from 'this_month' to 'all'
    });

    // Form state
    const [formData, setFormData] = useState({
        transaction_date: new Date().toISOString().slice(0, 10),
        description: "",
        category: "",
        transaction_type: "income",
        amount: "",
        account: "",
        source: "",
        school_id: "",
        payment_method: "cash",
        notes: "",
        evidence_file: null,
        evidence_url: "",
    });

    const [uploadingEvidence, setUploadingEvidence] = useState(false);

    const paymentMethods = [
        { value: "cash", label: "💰 Cash" },
        { value: "bank_transfer", label: "🏦 Bank Transfer" },
        { value: "check", label: "📜 Check" },
        { value: "online", label: "💳 Online Payment" },
    ];

    const statusOptions = [
        { value: "pending", label: "Pending", color: "yellow" },
        { value: "confirmed", label: "Confirmed", color: "green" },
        { value: "cancelled", label: "Cancelled", color: "red" },
    ];

    const periodOptions = [
        { value: "all", label: "All Time" },
        { value: "this_month", label: "This Month" },
        { value: "last_month", label: "Last Month" },
        { value: "this_year", label: "This Year" },
        { value: "custom", label: "Custom Range" },
    ];

    useEffect(() => {
        if (hasPermission("read_cash_flow")) {
            fetchInitialData();
        }
        logActivity("page_access", "Accessed Cash Flow page");
    }, []);

    useEffect(() => {
        if (hasPermission("read_cash_flow")) {
            fetchTransactions();
            fetchSummary();
        }
    }, [filters]);

    const fetchInitialData = async () => {
        try {
            const [categoriesRes, accountsRes, schoolsRes] = await Promise.all([
                fetch("/api/cash-flow/categories"),
                fetch("/api/cash-flow/accounts"),
                fetch("/api/schools"),
            ]);

            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setCategories(categoriesData.data || []);
            }

            if (accountsRes.ok) {
                const accountsData = await accountsRes.json();
                setAccounts(accountsData.data || []);
            }

            if (schoolsRes.ok) {
                const schoolsData = await schoolsRes.json();
                const schools = schoolsData.data || schoolsData;
                setSchools(Array.isArray(schools) ? schools : []);
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== "") params.append(key, value);
            });

            const response = await fetch(`/api/cash-flow?${params}`);
            if (response.ok) {
                const result = await response.json();
                setTransactions(result.data || []);
            } else {
                throw new Error("Failed to fetch transactions");
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            setError("Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.period && filters.period !== "") {
                params.append("period", filters.period);
            }
            if (filters.date_from) params.append("date_from", filters.date_from);
            if (filters.date_to) params.append("date_to", filters.date_to);

            const response = await fetch(`/api/cash-flow/summary?${params}`);
            if (response.ok) {
                const result = await response.json();
                setSummary(result.data);
            } else {
                console.error("Summary API error:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
    };

    const handleDelete = async (transactionId) => {
        if (!hasPermission("delete_cash_flow")) {
            setError("You do not have permission to delete cash flow transactions");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/cash-flow/${transactionId}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                setSuccess("Transaction deleted successfully");
                await Promise.all([fetchTransactions(), fetchSummary()]);
                logActivity("delete", `Deleted cash flow transaction ID: ${transactionId}`);
            } else {
                setError(result.error || "Failed to delete transaction");
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            setError("Failed to delete transaction");
        } finally {
            setLoading(false);
            setDeleteModalOpen(false);
            setTransactionToDelete(null);
        }
    };

    const confirmDelete = (transaction) => {
        setTransactionToDelete(transaction);
        setDeleteModalOpen(true);
    };

    const handleEvidenceUpload = async (file) => {
        if (!file) return null;

        try {
            setUploadingEvidence(true);

            const formData = new FormData();
            formData.append("evidence", file);

            const response = await fetch("/api/cash-flow/upload-evidence", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                setError(result.error || "Failed to upload evidence");
                return null;
            }
        } catch (error) {
            console.error("Error uploading evidence:", error);
            setError("Failed to upload evidence");
            return null;
        } finally {
            setUploadingEvidence(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (modalType === "create" && !hasPermission("create_cash_flow")) {
            setError("You do not have permission to create cash flow transactions");
            return;
        }

        if (modalType === "edit" && !hasPermission("update_cash_flow")) {
            setError("You do not have permission to update cash flow transactions");
            return;
        }

        // Validate evidence for new transactions
        if (modalType === "create" && !formData.evidence_file && !formData.evidence_url) {
            setError("Transaction evidence is required for all transactions");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            let evidenceData = null;

            // Upload evidence if new file is provided
            if (formData.evidence_file) {
                evidenceData = await handleEvidenceUpload(formData.evidence_file);
                if (!evidenceData) {
                    return; // Error already set in handleEvidenceUpload
                }
            }

            const url =
                modalType === "edit"
                    ? `/api/cash-flow/${selectedTransaction.id}`
                    : "/api/cash-flow";

            const method = modalType === "edit" ? "PUT" : "POST";

            const submitData = {
                ...formData,
                recorded_by: user?.name || "Unknown User",
            };

            // Add evidence data if uploaded
            if (evidenceData) {
                submitData.attachment_url = evidenceData.url;
                submitData.evidence_filename = evidenceData.filename;
                submitData.evidence_size = evidenceData.size;
                submitData.evidence_type = evidenceData.type;
            }

            // Remove file from submit data
            delete submitData.evidence_file;

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(
                    `Transaction ${modalType === "edit" ? "updated" : "created"} successfully`
                );
                setIsModalOpen(false);
                resetForm();
                await Promise.all([fetchTransactions(), fetchSummary()]);
                logActivity(
                    modalType === "edit" ? "update" : "create",
                    `${modalType === "edit" ? "Updated" : "Created"} ${
                        formData.transaction_type
                    } transaction: ${formData.description}`
                );
            } else {
                setError(
                    result.error ||
                        `Failed to ${modalType === "edit" ? "update" : "create"} transaction`
                );
            }
        } catch (error) {
            console.error(
                `Error ${modalType === "edit" ? "updating" : "creating"} transaction:`,
                error
            );
            setError(`Failed to ${modalType === "edit" ? "update" : "create"} transaction`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            transaction_date: new Date().toISOString().slice(0, 10),
            description: "",
            category: "",
            transaction_type: "income",
            amount: "",
            account: "",
            source: "",
            school_id: "",
            payment_method: "cash",
            notes: "",
            evidence_file: null,
            evidence_url: "",
        });
    };

    const openModal = (type, transaction = null) => {
        setModalType(type);
        setSelectedTransaction(transaction);

        if (transaction) {
            // Format the date properly for the input field (YYYY-MM-DD)
            const transactionDate = transaction.transaction_date
                ? new Date(transaction.transaction_date).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10);

            setFormData({
                transaction_date: transactionDate,
                description: transaction.description,
                category: transaction.category,
                transaction_type: transaction.transaction_type,
                amount: transaction.amount.toString(),
                account: transaction.account,
                source: transaction.source || "",
                school_id: transaction.school_id || "",
                payment_method: transaction.payment_method,
                notes: transaction.notes || "",
                evidence_file: null,
                evidence_url: transaction.attachment_url || "",
            });
        } else {
            resetForm();
        }

        setIsModalOpen(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (!hasPermission("read_cash_flow")) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 text-xl">Access Denied</div>
                <p className="text-gray-600 mt-2">
                    You do not have permission to view cash flow data.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        BB for Society - Donations Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Monitor donations, expenses, and account balances
                    </p>
                </div>

                {hasPermission("create_cash_flow") && (
                    <button
                        onClick={() => openModal("create")}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                        <span>+ Add Transaction</span>
                    </button>
                )}
            </div>

            {/* Error and Success Messages */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {success}
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                                <span className="text-2xl">💰</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Income</p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(summary.summary.total_income)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {summary.summary.income_count} transactions
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                                <span className="text-2xl">💸</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                                <p className="text-xl font-bold text-red-600">
                                    {formatCurrency(summary.summary.total_expenses)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {summary.summary.expense_count} transactions
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div
                                className={`p-3 rounded-full mr-4 ${
                                    summary.summary.net_income >= 0
                                        ? "bg-blue-100 text-blue-600"
                                        : "bg-orange-100 text-orange-600"
                                }`}
                            >
                                <span className="text-2xl">
                                    {summary.summary.net_income >= 0 ? "📈" : "📉"}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Net Income</p>
                                <p
                                    className={`text-xl font-bold ${
                                        summary.summary.net_income >= 0
                                            ? "text-blue-600"
                                            : "text-orange-600"
                                    }`}
                                >
                                    {formatCurrency(summary.summary.net_income)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {summary.summary.net_income >= 0 ? "Surplus" : "Deficit"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                                <span className="text-2xl">🏦</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                                <p className="text-xl font-bold text-purple-600">
                                    {formatCurrency(
                                        summary.account_balances.reduce(
                                            (sum, acc) => sum + acc.balance,
                                            0
                                        )
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {summary.account_balances.length} accounts
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Period
                        </label>
                        <select
                            value={filters.period}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, period: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {periodOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, type: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="income">💰 Income</option>
                            <option value="expense">💸 Expense</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            value={filters.category}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, category: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account
                        </label>
                        <select
                            value={filters.account}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, account: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Accounts</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.account_name}>
                                    {account.account_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {filters.period === "custom" && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date From
                                </label>
                                <input
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            date_from: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date To
                                </label>
                                <input
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, date_to: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </>
                    )}

                    <div className={filters.period === "custom" ? "md:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={filters.search}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, search: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Recent Transactions</h3>
                </div>

                {loading ? (
                    <div className="p-6 text-center">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No transactions found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Reference
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Account
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Income
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expense
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Balance
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((transaction, index) => {
                                    return (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatDate(
                                                            transaction.transaction_date
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {transaction.reference_number}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {transaction.description}
                                                </div>
                                                {transaction.school_name && (
                                                    <div className="text-xs text-gray-500">
                                                        📍 {transaction.school_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">
                                                    {transaction.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">
                                                    {transaction.account}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-green-600">
                                                    {transaction.transaction_type === "income"
                                                        ? formatCurrency(transaction.amount)
                                                        : "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-red-600">
                                                    {transaction.transaction_type === "expense"
                                                        ? formatCurrency(transaction.amount)
                                                        : "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div
                                                    className={`text-sm font-bold ${
                                                        transaction.running_balance >= 0
                                                            ? "text-blue-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {formatCurrency(transaction.running_balance)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            openModal("view", transaction)
                                                        }
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </button>
                                                    {hasPermission("update_cash_flow") && (
                                                        <button
                                                            onClick={() =>
                                                                openModal("edit", transaction)
                                                            }
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                        {hasPermission("delete_cash_flow") && (
                                                            <button
                                                                onClick={() =>
                                                                    confirmDelete(transaction)
                                                                }
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal for Create/Edit Transaction */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    modalType === "create"
                        ? "Add New Transaction"
                        : modalType === "edit"
                        ? "Edit Transaction"
                        : "Transaction Details"
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Transaction Date *
                            </label>
                            <input
                                type="date"
                                value={formData.transaction_date}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        transaction_date: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={modalType === "view"}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type *
                            </label>
                            <select
                                value={formData.transaction_type}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        transaction_type: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={modalType === "view"}
                            >
                                <option value="income">💰 Income</option>
                                <option value="expense">💸 Expense</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, description: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter transaction description"
                            required
                            disabled={modalType === "view"}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={modalType === "view"}
                            >
                                <option value="">Select Category</option>
                                {categories
                                    .filter((cat) => cat.type === formData.transaction_type)
                                    .map((category) => (
                                        <option key={category.id} value={category.name}>
                                            {category.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount *
                            </label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                                min="0"
                                step="1000"
                                required
                                disabled={modalType === "view"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account *
                            </label>
                            <select
                                value={formData.account}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, account: e.target.value }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={modalType === "view"}
                            >
                                <option value="">Select Account</option>
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.account_name}>
                                        {account.account_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                value={formData.payment_method}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        payment_method: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={modalType === "view"}
                            >
                                {paymentMethods.map((method) => (
                                    <option key={method.value} value={method.value}>
                                        {method.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Source/Recipient
                            </label>
                            <input
                                type="text"
                                value={formData.source}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, source: e.target.value }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Who paid/received this?"
                                disabled={modalType === "view"}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                School (Optional)
                            </label>
                            <select
                                value={formData.school_id}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, school_id: e.target.value }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={modalType === "view"}
                            >
                                <option value="">No specific school</option>
                                {Array.isArray(schools) &&
                                    schools.map((school) => (
                                        <option key={school.id} value={school.id}>
                                            {school.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional notes..."
                            disabled={modalType === "view"}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction Evidence *{" "}
                            {modalType === "create" && (
                                <span className="text-red-500 text-xs">(Required)</span>
                            )}
                        </label>
                        {modalType !== "view" && (
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Validate file size (5MB)
                                            if (file.size > 5 * 1024 * 1024) {
                                                setError("File size must be less than 5MB");
                                                e.target.value = "";
                                                return;
                                            }
                                            setFormData((prev) => ({
                                                ...prev,
                                                evidence_file: file,
                                            }));
                                            setError(null);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={uploadingEvidence}
                                    required={modalType === "create"}
                                />
                                <p className="text-xs text-gray-500">
                                    Supported formats: JPG, PNG, PDF (Max 5MB)
                                </p>
                                {uploadingEvidence && (
                                    <p className="text-sm text-blue-600">Uploading evidence...</p>
                                )}
                                {formData.evidence_file && (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                        <p className="text-sm text-green-600">
                                            📄 File selected: {formData.evidence_file.name} (
                                            {(formData.evidence_file.size / 1024 / 1024).toFixed(2)}{" "}
                                            MB)
                                        </p>
                                        {formData.evidence_file.type.startsWith("image/") && (
                                            <div className="mt-2">
                                                <img
                                                    src={URL.createObjectURL(
                                                        formData.evidence_file
                                                    )}
                                                    alt="Preview"
                                                    className="max-w-full h-32 object-cover rounded border"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {formData.evidence_url && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-600 mb-2">Current evidence:</p>
                                <button
                                    type="button"
                                    onClick={() => setEvidenceModalOpen(true)}
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    📄 View Evidence
                                </button>
                            </div>
                        )}

                        {modalType === "view" && !formData.evidence_url && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">No evidence available</p>
                            </div>
                        )}
                    </div>

                    {modalType !== "view" && (
                        <div className="flex space-x-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                            >
                                {loading
                                    ? "Saving..."
                                    : modalType === "create"
                                    ? "Create Transaction"
                                    : "Update Transaction"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </form>
            </Modal>

            {/* Evidence Modal */}
            <Modal
                isOpen={evidenceModalOpen}
                onClose={() => setEvidenceModalOpen(false)}
                title="Transaction Evidence"
            >
                <div className="max-w-full">
                    {formData.evidence_url ? (
                        <div className="text-center">
                            {formData.evidence_url.toLowerCase().includes(".pdf") ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">📄</div>
                                            <p className="text-gray-600 mb-4">PDF Document</p>
                                            <a
                                                href={formData.evidence_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md inline-flex items-center"
                                            >
                                                📄 Open PDF
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={formData.evidence_url}
                                    alt="Transaction Evidence"
                                    className="max-w-full h-auto rounded-lg shadow-md"
                                    style={{ maxHeight: "70vh" }}
                                />
                            )}
                            <div className="mt-4">
                                <a
                                    href={formData.evidence_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Open in new tab
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-4">📄</div>
                            <p className="text-gray-600">No evidence available</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setTransactionToDelete(null);
                }}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">🗑️</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Delete Transaction
                        </h3>
                        <p className="text-gray-600">
                            Are you sure you want to delete this transaction? This action cannot be
                            undone.
                        </p>
                    </div>

                    {transactionToDelete && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <h4 className="font-medium text-gray-900 mb-2">Transaction Details:</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                    <strong>Date:</strong>{" "}
                                    {formatDate(transactionToDelete.transaction_date)}
                                </p>
                                <p>
                                    <strong>Description:</strong> {transactionToDelete.description}
                                </p>
                                <p>
                                    <strong>Type:</strong>{" "}
                                    {transactionToDelete.transaction_type === "income"
                                        ? "💰 Income"
                                        : "💸 Expense"}
                                </p>
                                <p>
                                    <strong>Amount:</strong>{" "}
                                    {formatCurrency(transactionToDelete.amount)}
                                </p>
                                <p>
                                    <strong>Category:</strong> {transactionToDelete.category}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={() => handleDelete(transactionToDelete?.id)}
                            disabled={loading}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                        >
                            {loading ? "Deleting..." : "Yes, Delete"}
                        </button>
                        <button
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setTransactionToDelete(null);
                            }}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CashFlowManagement;
