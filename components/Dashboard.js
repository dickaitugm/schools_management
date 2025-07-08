"use client";

import React, { useState, useEffect } from "react";
import { formatDateIndonesian } from "../utils/dateUtils";

// Flag untuk memastikan console.log hanya dijalankan sekali
let messageShown = false;

const Dashboard = () => {
    const [stats, setStats] = useState({
        schools: 0,
        teachers: 0,
        students: 0,
        lessons: 0,
        schedules: 0,
    });
    const [dashboardData, setDashboardData] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Console.log pesan khusus hanya sekali
        if (!messageShown) {
            console.log(`Halo, Salsabilla Ratu Raya. Selamat sudah menemukan jawaban dari teka-teki yang diberikan. :D

Catatan ini berisi curahat hati dari sang pengembang. 
Di setiap perkumpulan dengan orang-orang, kebiasaanku selalu mengamati dan memperhatikan perilaku dan kebiasaan orang dengan tujuan agar tidak salah langkah dalam melakukan tindakan. Beberapa kali bertemu dan berkomunikasi di satu aktivitas bersama, bukan tindakan yang harus ku antisipasi, tapi aku malah melihat sesuatu yang berbeda di kamu dan jarang ditemukan di perempuan lainnya. Perempuan dengan wawasan yang luas dan cerdas, komunikasi dan tutur kata yang rapih, selalu mengerti konteks pembahasan, sudut pandang yang adaptif, dan suara ketawa yang tersimpan jelas di memori, menarik perhatianku untuk ingin lebih kenal lebih dekat lagi dalam hubungan yang lebih serius sebagai pasangan atau teman hidup. Jujur, aku sangat suka orang yg memiliki kecerdasan wawasan, komunikasi sefrekuensi, proses belajar/evaluasi (non akademik), dan berusaha dalam kehidupan.

Selain itu, ternyata kamu juga punya misi dalam hidup yang hampir sama denganku, yaitu membantu teman-teman yang kurang dalam kehidupan ataupun keilmuwan. Dari sini, aku tertegun, berkomitmen, dan mencoba berusaha untuk mendukung kamu dalam kegiatan/program tersebut. Sepertinya akan menyenangkan memiliki teman hidup hingga akhir hayat jika ia selalu ingin berdiskusi dan memberi pendapat atas apa yang akan dilakukan meskipun kehidupan ini ada masanya entah di atas atau di bawah. Namun ku pastikan akan selalu berusaha dalam menghadapi lika liku kehidupan. Selebihnya, kita bisa membahas tentang cara pandang hidup untuk masa depan. 

Would you like to date to discuss about future, faith, and science? xD`);
            messageShown = true;
        }

        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch comprehensive stats data
            const statsResponse = await fetch("/api/dashboard/stats");
            if (statsResponse.ok) {
                const statsResult = await statsResponse.json();
                if (statsResult.success) {
                    setStatsData(statsResult.data);
                    setStats({
                        schools: statsResult.data.counts.totalSchools,
                        teachers: statsResult.data.counts.totalTeachers,
                        students: statsResult.data.counts.totalStudents,
                        lessons: statsResult.data.counts.totalLessons,
                        schedules: statsResult.data.counts.totalSchedules,
                    });
                }
            }

            // Fetch original dashboard data for fallback compatibility
            const response = await fetch("/api/dashboard");
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setDashboardData(result.data);
                }
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // Fallback to old stats endpoint
            await fetchStatsOnly();
        } finally {
            setLoading(false);
        }
    };

    const fetchStatsOnly = async () => {
        try {
            const response = await fetch("/api/dashboard/stats");

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setStats(result.data);
                }
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            // Set default stats on error
            setStats({
                schools: 0,
                teachers: 0,
                students: 0,
                lessons: 0,
                schedules: 0,
            });
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="ml-3 text-gray-500 text-xl">Loading dashboard...</div>
            </div>
        );
    }

    // Prepare chart data
    const studentsPerSchoolData = dashboardData?.studentsPerSchool || [];

    // Colors for charts
    const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    // Prepare stacked bar chart data for schedules (assessed vs not assessed)
    const prepareScheduleAssessmentData = (scheduleData) => {
        if (!scheduleData || scheduleData.length === 0) return [];

        // Group schedules by date and aggregate students by school
        const dateGroups = {};

        scheduleData.forEach((schedule) => {
            const date = new Date(schedule.scheduled_date).toLocaleDateString("en-GB");
            const schoolName = schedule.school_name;
            const assessedCount = parseInt(schedule.student_count) || 0;
            const totalSchoolStudents = parseInt(schedule.total_school_students) || 0;
            const notAssessedCount = Math.max(0, totalSchoolStudents - assessedCount);

            if (!dateGroups[date]) {
                dateGroups[date] = {
                    date,
                    schools: {},
                };
            }

            // Accumulate students for each school on this date
            if (!dateGroups[date].schools[schoolName]) {
                dateGroups[date].schools[schoolName] = {
                    assessed: 0,
                    notAssessed: 0,
                };
            }

            dateGroups[date].schools[schoolName].assessed += assessedCount;
            dateGroups[date].schools[schoolName].notAssessed += notAssessedCount;
        });

        // Convert to chart format
        return Object.values(dateGroups)
            .sort(
                (a, b) =>
                    new Date(a.date.split("/").reverse().join("/")) -
                    new Date(b.date.split("/").reverse().join("/"))
            )
            .map((group) => {
                const result = { date: group.date };

                // Add assessed and not assessed data for each school
                Object.keys(group.schools).forEach((school) => {
                    result[`${school}_assessed`] = group.schools[school].assessed;
                    result[`${school}_not_assessed`] = group.schools[school].notAssessed;
                });

                return result;
            });
    };

    const scheduleAssessmentData = prepareScheduleAssessmentData(dashboardData?.scheduleData);

    // Get unique schools from stats data for dynamic color mapping
    const uniqueSchools = statsData?.schools
        ? statsData.schools.map((school) => school.name)
        : dashboardData?.scheduleData
        ? [...new Set(dashboardData.scheduleData.map((item) => item.school_name).filter(Boolean))]
        : [];

    // Dynamic school colors mapping
    const generateSchoolColors = (schools) => {
        const colors = {};
        schools.forEach((school, index) => {
            colors[school] = COLORS[index % COLORS.length];
        });
        return colors;
    };

    const schoolColors = generateSchoolColors(uniqueSchools);

    // Get color for school, with fallback
    const getSchoolColor = (schoolName, index) => {
        return schoolColors[schoolName] || COLORS[index % COLORS.length];
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">BB for Society Dashboard</h1>
                    {statsData?.currentTime && (
                        <p className="text-sm text-gray-500 mt-1">
                            Data updated:{" "}
                            {formatDateIndonesian(new Date(statsData.currentTime), true)}
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-3">
                            <span className="text-xl">🏫</span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">Schools</p>
                            <p className="text-xl font-bold text-gray-900">{stats.schools}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-3">
                            <span className="text-xl">👨‍🏫</span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">Teachers</p>
                            <p className="text-xl font-bold text-gray-900">{stats.teachers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-3">
                            <span className="text-xl">👨‍🎓</span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">Students</p>
                            <p className="text-xl font-bold text-gray-900">{stats.students}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                            <span className="text-xl">📚</span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">Lessons</p>
                            <p className="text-xl font-bold text-gray-900">{stats.lessons}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-3">
                            <span className="text-xl">📅</span>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">Schedules</p>
                            <p className="text-xl font-bold text-gray-900">{stats.schedules}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Cards */}
            {dashboardData?.analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">
                                    Active Schedules
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                    {dashboardData.analytics.totalActiveSchedules}
                                </p>
                            </div>
                            <div className="p-2 bg-green-100 rounded-full">
                                <span className="text-green-600">📋</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">
                                    Completed Schedules
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                    {dashboardData.analytics.totalCompletedSchedules}
                                </p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-full">
                                <span className="text-blue-600">✅</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">
                                    Students in Schedules
                                </p>
                                <p className="text-lg font-bold text-purple-600">
                                    {dashboardData.analytics.totalStudentsInSchedules}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-full">
                                <span className="text-purple-600">👥</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">
                                    Avg Students/Schedule
                                </p>
                                <p className="text-lg font-bold text-orange-600">
                                    {dashboardData.analytics.averageStudentsPerSchedule}
                                </p>
                            </div>
                            <div className="p-2 bg-orange-100 rounded-full">
                                <span className="text-orange-600">📊</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {(dashboardData || statsData) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent and Upcoming Schedules Cards */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Upcoming & Recent Schedules
                        </h3>
                        {/* Upcoming Schedules */}
                        {statsData?.upcomingSchedules && statsData.upcomingSchedules.length > 0 ? (
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming</h4>
                                {statsData.upcomingSchedules.slice(0, 2).map((schedule) => {
                                    const scheduleDate = new Date(schedule.scheduled_date);
                                    const scheduleTime = schedule.scheduled_time;
                                    const isUpcoming = schedule.status === "scheduled";

                                    return (
                                        <div
                                            key={schedule.id}
                                            className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-sm">
                                                        {schedule.school_name}
                                                    </h4>
                                                </div>
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        isUpcoming
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {schedule.status === "scheduled"
                                                        ? "Scheduled"
                                                        : schedule.status}
                                                </span>
                                            </div>

                                            {/* Compact Schedule Details */}
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-gray-600 font-medium">
                                                        📅{" "}
                                                    </span>
                                                    <span className="text-gray-900">
                                                        {formatDateIndonesian(
                                                            schedule.scheduled_date
                                                        )}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600 font-medium">
                                                        ⏰{" "}
                                                    </span>
                                                    <span className="text-gray-900">
                                                        {scheduleTime
                                                            ? scheduleTime.slice(0, 5)
                                                            : "00:00"}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600 font-medium">
                                                        👥{" "}
                                                    </span>
                                                    <span className="text-gray-900">
                                                        {schedule.assessed_students}/
                                                        {schedule.total_school_students} assessed
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-gray-600 font-medium">
                                                        📚{" "}
                                                    </span>
                                                    <span className="text-gray-900">
                                                        {schedule.lesson_activity ||
                                                            schedule.notes ||
                                                            "General Learning Activity"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24 text-gray-500">
                                <div className="text-center">
                                    <p className="text-sm">No upcoming schedules found.</p>
                                </div>
                            </div>
                        )}

                        {/* Recent Schedules */}
                        {statsData?.recentSchedules && statsData.recentSchedules.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent</h4>
                                <div className="space-y-3">
                                    {statsData.recentSchedules.slice(0, 2).map((schedule) => {
                                        const scheduleDate = new Date(schedule.scheduled_date);
                                        const scheduleTime = schedule.scheduled_time;
                                        const isCompleted = schedule.status === "completed";

                                        return (
                                            <div
                                                key={schedule.id}
                                                className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                            >
                                                {/* Header */}
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 text-sm">
                                                            {schedule.school_name}
                                                        </h4>
                                                    </div>
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            isCompleted
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                    >
                                                        {schedule.status === "completed"
                                                            ? "Completed"
                                                            : schedule.status}
                                                    </span>
                                                </div>

                                                {/* Compact Schedule Details */}
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <span className="text-gray-600 font-medium">
                                                            📅{" "}
                                                        </span>
                                                        <span className="text-gray-900">
                                                            {formatDateIndonesian(
                                                                schedule.scheduled_date
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span className="text-gray-600 font-medium">
                                                            ⏰{" "}
                                                        </span>
                                                        <span className="text-gray-900">
                                                            {scheduleTime
                                                                ? scheduleTime.slice(0, 5)
                                                                : "00:00"}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span className="text-gray-600 font-medium">
                                                            👥{" "}
                                                        </span>
                                                        <span className="text-gray-900">
                                                            {schedule.assessed_students}/
                                                            {schedule.total_school_students}{" "}
                                                            assessed
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span className="text-gray-600 font-medium">
                                                            📚{" "}
                                                        </span>
                                                        <span className="text-gray-900">
                                                            {schedule.lesson_activity ||
                                                                schedule.notes ||
                                                                "General Learning Activity"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Compact Assessment Summary (only for completed) */}
                                                {isCompleted && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                                        <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">
                                                                    Personal:
                                                                </span>
                                                                <span className="text-gray-900 font-medium">
                                                                    {schedule.avg_personal
                                                                        ? parseFloat(
                                                                              schedule.avg_personal
                                                                          ).toFixed(1)
                                                                        : "0.0"}
                                                                    /5
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">
                                                                    Critical:
                                                                </span>
                                                                <span className="text-gray-900 font-medium">
                                                                    {schedule.avg_critical
                                                                        ? parseFloat(
                                                                              schedule.avg_critical
                                                                          ).toFixed(1)
                                                                        : "0.0"}
                                                                    /5
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">
                                                                    Team Work:
                                                                </span>
                                                                <span className="text-gray-900 font-medium">
                                                                    {schedule.avg_teamwork
                                                                        ? parseFloat(
                                                                              schedule.avg_teamwork
                                                                          ).toFixed(1)
                                                                        : "0.0"}
                                                                    /5
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">
                                                                    Academic:
                                                                </span>
                                                                <span className="text-gray-900 font-medium">
                                                                    {schedule.avg_academic
                                                                        ? parseFloat(
                                                                              schedule.avg_academic
                                                                          ).toFixed(1)
                                                                        : "0.0"}
                                                                    /5
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-50">
                                                            <span className="text-gray-700 font-medium">
                                                                Overall Average:
                                                            </span>
                                                            <span className="text-blue-600 font-semibold">
                                                                {schedule.avg_overall
                                                                    ? parseFloat(
                                                                          schedule.avg_overall
                                                                      ).toFixed(1)
                                                                    : "0.0"}
                                                                /5
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Custom Stacked Bar Chart - Assessment Progress by School */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Student Assessment Progress by School
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Shows assessed vs not assessed students by schedule dates
                        </p>
                        {scheduleAssessmentData.length > 0 ? (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                {/* Legend */}
                                <div className="flex justify-center mb-4 flex-wrap">
                                    <div className="flex space-x-6 text-sm">
                                        {uniqueSchools.map((school, index) => (
                                            <div key={school} className="flex items-center">
                                                <div
                                                    className="w-4 h-4 rounded mr-2"
                                                    style={{
                                                        backgroundColor: getSchoolColor(
                                                            school,
                                                            index
                                                        ),
                                                    }}
                                                ></div>
                                                <span>{school}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Calculate max value once for consistency */}
                                {(() => {
                                    const maxValue = Math.max(
                                        ...scheduleAssessmentData.flatMap((data) =>
                                            uniqueSchools.map(
                                                (school) =>
                                                    (data[`${school}_assessed`] || 0) +
                                                    (data[`${school}_not_assessed`] || 0)
                                            )
                                        ),
                                        1 // Minimum value to avoid division by zero
                                    );

                                    // Calculate better step for Y-axis to avoid duplicates
                                    const calculateYAxisTicks = (max) => {
                                        // Find a nice round number that's higher than max
                                        let step;
                                        if (max <= 3) step = 1;
                                        else if (max <= 5) step = 1;
                                        else if (max <= 10) step = 2;
                                        else if (max <= 20) step = 5;
                                        else if (max <= 50) step = 10;
                                        else if (max <= 100) step = 20;
                                        else if (max <= 200) step = 50;
                                        else step = Math.ceil(max / 5 / 10) * 10;

                                        // For small values, ensure we have enough space
                                        let roundedMax = Math.ceil(max / step) * step;
                                        if (roundedMax < 5 && max <= 3) {
                                            roundedMax = 5; // Minimum chart height for readability
                                        }

                                        const ticks = [];
                                        for (let i = 0; i <= 5; i++) {
                                            const value = Math.round((roundedMax * (5 - i)) / 5);
                                            ticks.push(value);
                                        }

                                        // Remove duplicates while maintaining order
                                        const uniqueTicks = [...new Set(ticks)].sort(
                                            (a, b) => b - a
                                        );

                                        return { ticks: uniqueTicks, roundedMax };
                                    };

                                    const { ticks, roundedMax } = calculateYAxisTicks(maxValue);

                                    return (
                                        /* Chart Container */
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex">
                                                {/* Y-axis title */}
                                                <div className="flex items-center pr-2">
                                                    <div
                                                        className="text-xs text-gray-600 font-medium"
                                                        style={{
                                                            writingMode: "vertical-rl",
                                                            textOrientation: "mixed",
                                                            transform: "rotate(180deg)",
                                                        }}
                                                    >
                                                        Student Count
                                                    </div>
                                                </div>

                                                {/* Y-axis labels */}
                                                <div
                                                    className="flex flex-col justify-between text-xs text-gray-500 pr-3 border-r border-gray-200"
                                                    style={{ height: "300px" }}
                                                >
                                                    {ticks.map((value, i) => (
                                                        <span key={`tick-${i}-${value}`}>
                                                            {value}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Chart area */}
                                                <div
                                                    className="flex-1 relative ml-4"
                                                    style={{ height: "300px" }}
                                                >
                                                    {/* Grid lines */}
                                                    <div className="absolute inset-0">
                                                        {ticks.map((value, level) => (
                                                            <div
                                                                key={`grid-${level}-${value}`}
                                                                className="absolute w-full border-t border-gray-100"
                                                                style={{
                                                                    bottom: `${
                                                                        (level /
                                                                            (ticks.length - 1)) *
                                                                        100
                                                                    }%`,
                                                                }}
                                                            ></div>
                                                        ))}
                                                    </div>

                                                    {/* Bars for each date */}
                                                    <div className="absolute inset-0 flex items-end justify-around px-4">
                                                        {scheduleAssessmentData.map(
                                                            (dateData, dateIndex) => {
                                                                return (
                                                                    <div
                                                                        key={dateData.date}
                                                                        className="flex flex-col items-center"
                                                                    >
                                                                        <div className="flex items-end space-x-1">
                                                                            {uniqueSchools.map(
                                                                                (
                                                                                    school,
                                                                                    schoolIndex
                                                                                ) => {
                                                                                    const assessedCount =
                                                                                        dateData[
                                                                                            `${school}_assessed`
                                                                                        ] || 0;
                                                                                    const notAssessedCount =
                                                                                        dateData[
                                                                                            `${school}_not_assessed`
                                                                                        ] || 0;
                                                                                    const totalCount =
                                                                                        assessedCount +
                                                                                        notAssessedCount;

                                                                                    if (
                                                                                        totalCount ===
                                                                                        0
                                                                                    )
                                                                                        return null;

                                                                                    const totalBarHeight =
                                                                                        roundedMax >
                                                                                        0
                                                                                            ? (totalCount /
                                                                                                  roundedMax) *
                                                                                              300
                                                                                            : 0;
                                                                                    const assessedHeight =
                                                                                        totalCount >
                                                                                        0
                                                                                            ? (assessedCount /
                                                                                                  totalCount) *
                                                                                              totalBarHeight
                                                                                            : 0;
                                                                                    const notAssessedHeight =
                                                                                        totalBarHeight -
                                                                                        assessedHeight;

                                                                                    return (
                                                                                        <div
                                                                                            key={`${school}-${dateData.date}`}
                                                                                            className="relative w-8 group cursor-pointer"
                                                                                            style={{
                                                                                                height: `${totalBarHeight}px`,
                                                                                            }}
                                                                                        >
                                                                                            {/* Assessed students (bottom part) */}
                                                                                            <div
                                                                                                className="absolute bottom-0 w-full border border-gray-300 transition-colors"
                                                                                                style={{
                                                                                                    height: `${assessedHeight}px`,
                                                                                                    backgroundColor:
                                                                                                        getSchoolColor(
                                                                                                            school,
                                                                                                            schoolIndex
                                                                                                        ),
                                                                                                }}
                                                                                            ></div>

                                                                                            {/* Not assessed students (top part) */}
                                                                                            <div
                                                                                                className="absolute w-full border border-gray-300 transition-colors"
                                                                                                style={{
                                                                                                    bottom: `${assessedHeight}px`,
                                                                                                    height: `${notAssessedHeight}px`,
                                                                                                    backgroundColor:
                                                                                                        getSchoolColor(
                                                                                                            school,
                                                                                                            schoolIndex
                                                                                                        ),
                                                                                                    opacity: 0.4,
                                                                                                }}
                                                                                            ></div>

                                                                                            {/* Tooltip */}
                                                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                                                                                                <div className="text-center">
                                                                                                    <div className="font-semibold">
                                                                                                        {
                                                                                                            school
                                                                                                        }
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        Assessed:{" "}
                                                                                                        {
                                                                                                            assessedCount
                                                                                                        }
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        Not
                                                                                                        Assessed:{" "}
                                                                                                        {
                                                                                                            notAssessedCount
                                                                                                        }
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        Total:{" "}
                                                                                                        {
                                                                                                            totalCount
                                                                                                        }
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        {
                                                                                                            dateData.date
                                                                                                        }
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* X-axis labels (date labels outside chart area) */}
                                            <div className="flex justify-around px-4 mt-4 border-t border-gray-100 pt-3">
                                                {scheduleAssessmentData.map((dateData) => (
                                                    <div
                                                        key={dateData.date}
                                                        className="text-xs text-gray-500 text-center transform -rotate-45 origin-center"
                                                    >
                                                        {dateData.date}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* X-axis title */}
                                            <div className="text-center text-xs text-gray-500 mt-2">
                                                Schedule Dates by School
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    <p className="mt-2">No schedule data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Cash Flow Table */}
            {dashboardData?.recentCashFlow && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Cash Flow</h3>
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
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {dashboardData.recentCashFlow.map((transaction, index) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {new Date(
                                                        transaction.transaction_date
                                                    ).toLocaleDateString("id-ID", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
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
                                                    ? new Intl.NumberFormat("id-ID", {
                                                          style: "currency",
                                                          currency: "IDR",
                                                          minimumFractionDigits: 0,
                                                          maximumFractionDigits: 0,
                                                      }).format(transaction.amount)
                                                    : "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-red-600">
                                                {transaction.transaction_type === "expense"
                                                    ? new Intl.NumberFormat("id-ID", {
                                                          style: "currency",
                                                          currency: "IDR",
                                                          minimumFractionDigits: 0,
                                                          maximumFractionDigits: 0,
                                                      }).format(transaction.amount)
                                                    : "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div
                                                className={`text-sm font-bold ${
                                                    (transaction.running_balance || 0) >= 0
                                                        ? "text-blue-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {new Intl.NumberFormat("id-ID", {
                                                    style: "currency",
                                                    currency: "IDR",
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                }).format(transaction.running_balance || 0)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
