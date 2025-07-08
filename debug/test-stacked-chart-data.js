// Test data processing for stacked bar chart
const sampleScheduleData = [
    {
        id: 9,
        scheduled_date: "2025-07-11T17:00:00.000Z",
        status: "scheduled",
        school_name: "Rusunawa Cibuluh",
        student_count: "0",
    },
    {
        id: 6,
        scheduled_date: "2025-06-26T17:00:00.000Z",
        status: "completed",
        school_name: "Rusunawa Cibuluh",
        student_count: "2",
    },
    {
        id: 8,
        scheduled_date: "2025-06-04T17:00:00.000Z",
        status: "completed",
        school_name: "Rusunawa Cibuluh",
        student_count: "2",
    },
    {
        id: 5,
        scheduled_date: "2025-01-17T17:00:00.000Z",
        status: "completed",
        school_name: "SMA Cerdas Berkarya",
        student_count: "0",
    },
    {
        id: 4,
        scheduled_date: "2025-01-16T17:00:00.000Z",
        status: "completed",
        school_name: "SMP Tunas Muda",
        student_count: "2",
    },
];

function prepareScheduleStackedData(scheduleData) {
    if (!scheduleData || scheduleData.length === 0) return [];

    // Group schedules by date and aggregate students by school
    const dateGroups = {};

    scheduleData.forEach((schedule) => {
        const date = new Date(schedule.scheduled_date).toLocaleDateString("en-GB");
        const schoolName = schedule.school_name;
        const studentCount = parseInt(schedule.student_count) || 0;

        if (!dateGroups[date]) {
            dateGroups[date] = {
                date,
                totalStudents: 0,
                schools: {},
            };
        }

        // Accumulate students for each school on this date
        if (!dateGroups[date].schools[schoolName]) {
            dateGroups[date].schools[schoolName] = 0;
        }
        dateGroups[date].schools[schoolName] += studentCount;
        dateGroups[date].totalStudents += studentCount;
    });

    // Convert to chart format
    return Object.values(dateGroups)
        .sort(
            (a, b) =>
                new Date(a.date.split("/").reverse().join("/")) -
                new Date(b.date.split("/").reverse().join("/"))
        )
        .map((group) => ({
            date: group.date,
            totalStudents: group.totalStudents,
            ...group.schools,
        }));
}

console.log("📊 Testing stacked bar chart data processing...");
console.log("\n🔍 Input data:");
console.table(
    sampleScheduleData.map((s) => ({
        Date: new Date(s.scheduled_date).toLocaleDateString("en-GB"),
        School: s.school_name,
        Students: s.student_count,
        Status: s.status,
    }))
);

const result = prepareScheduleStackedData(sampleScheduleData);
console.log("\n✅ Processed stacked chart data:");
console.table(result);

console.log("\n🏫 Unique schools:");
const uniqueSchools = [...new Set(sampleScheduleData.map((s) => s.school_name))];
console.log(uniqueSchools);

console.log("\n🎨 School color mapping:");
const schoolColors = {
    "SD Harapan Bangsa": "#3B82F6", // Blue
    "SMP Tunas Muda": "#10B981", // Green
    "SMA Cerdas Berkarya": "#F59E0B", // Yellow/Orange
    "Rusunawa Cibuluh": "#EF4444", // Red
};
uniqueSchools.forEach((school) => {
    console.log(`${school}: ${schoolColors[school] || "Default color"}`);
});
