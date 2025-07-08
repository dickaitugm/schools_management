// Test overlapping bar chart data preparation
// This script tests the data structure for the overlapping bar chart

const testScheduleData = [
    {
        id: 1,
        scheduled_date: "2024-01-15",
        school_name: "SD Harapan Bangsa",
        student_count: 15,
        total_school_students: 25,
        status: "completed",
    },
    {
        id: 2,
        scheduled_date: "2024-01-15",
        school_name: "SMP Tunas Muda",
        student_count: 12,
        total_school_students: 30,
        status: "completed",
    },
    {
        id: 3,
        scheduled_date: "2024-01-16",
        school_name: "SD Harapan Bangsa",
        student_count: 18,
        total_school_students: 25,
        status: "completed",
    },
    {
        id: 4,
        scheduled_date: "2024-01-16",
        school_name: "SMA Cerdas Berkarya",
        student_count: 22,
        total_school_students: 40,
        status: "completed",
    },
];

// Function to prepare overlapping chart data (copied from Dashboard.js)
const prepareScheduleOverlappingData = (scheduleData) => {
    if (!scheduleData || scheduleData.length === 0) return [];

    // Group schedules by date and aggregate students by school
    const dateGroups = {};

    scheduleData.forEach((schedule) => {
        const date = new Date(schedule.scheduled_date).toLocaleDateString("en-GB");
        const schoolName = schedule.school_name;
        const studentCount = parseInt(schedule.student_count) || 0;
        const totalSchoolStudents = parseInt(schedule.total_school_students) || 0;

        if (!dateGroups[date]) {
            dateGroups[date] = {
                date,
                totalStudents: 0,
                schools: {},
                schoolTotals: {},
            };
        }

        // Accumulate assessed students for each school on this date
        if (!dateGroups[date].schools[schoolName]) {
            dateGroups[date].schools[schoolName] = 0;
        }
        dateGroups[date].schools[schoolName] += studentCount;
        dateGroups[date].totalStudents += studentCount;

        // Store total students for each school (for background bar)
        dateGroups[date].schoolTotals[schoolName] = totalSchoolStudents;
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
            // Add total students for background bars (prefixed with 'total_')
            ...Object.keys(group.schoolTotals).reduce((acc, school) => {
                acc[`total_${school}`] = group.schoolTotals[school];
                return acc;
            }, {}),
            // Add assessed students for each school
            ...group.schools,
        }));
};

// Test the function
console.log("Testing overlapping bar chart data preparation...\n");

const result = prepareScheduleOverlappingData(testScheduleData);

console.log("Input data:");
console.log(JSON.stringify(testScheduleData, null, 2));

console.log("\nProcessed chart data:");
console.log(JSON.stringify(result, null, 2));

console.log("\nData structure analysis:");
result.forEach((item, index) => {
    console.log(`\nDate ${index + 1}: ${item.date}`);

    // Find background bars (total_* keys)
    const backgroundBars = Object.keys(item).filter((key) => key.startsWith("total_"));
    console.log("Background bars (total students):");
    backgroundBars.forEach((key) => {
        const school = key.replace("total_", "");
        console.log(`  - ${school}: ${item[key]} total students`);
    });

    // Find foreground bars (school names without total_ prefix)
    const foregroundBars = Object.keys(item).filter(
        (key) => !key.startsWith("total_") && key !== "date" && key !== "totalStudents"
    );
    console.log("Foreground bars (assessed students):");
    foregroundBars.forEach((school) => {
        console.log(`  - ${school}: ${item[school]} assessed students`);
    });
});

console.log("\n✅ Test completed successfully!");
console.log("The data structure is ready for the overlapping bar chart.");
