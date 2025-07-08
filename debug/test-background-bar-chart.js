const fetch = require("node-fetch");

async function testBackgroundBarChart() {
    try {
        console.log("=== Testing Background Bar Chart Data ===");

        // Test dashboard API
        const response = await fetch("http://localhost:3000/api/dashboard");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            console.error("❌ Dashboard API failed:", result.error);
            return;
        }

        console.log("✅ Dashboard API successful");
        console.log("📊 Schedule data count:", result.data.scheduleData?.length || 0);

        if (result.data.scheduleData && result.data.scheduleData.length > 0) {
            console.log("\n=== Schedule Data Sample ===");
            result.data.scheduleData.slice(0, 3).forEach((schedule, index) => {
                console.log(`${index + 1}. School: ${schedule.school_name}`);
                console.log(`   Date: ${schedule.scheduled_date}`);
                console.log(`   Assessed Students: ${schedule.student_count}`);
                console.log(`   Total School Students: ${schedule.total_school_students}`);
                console.log("");
            });

            // Simulate data processing for chart
            console.log("\n=== Processed Chart Data ===");
            const scheduleData = result.data.scheduleData;

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

                // Accumulate students for each school on this date
                if (!dateGroups[date].schools[schoolName]) {
                    dateGroups[date].schools[schoolName] = 0;
                }
                dateGroups[date].schools[schoolName] += studentCount;
                dateGroups[date].totalStudents += studentCount;

                // Store total students for each school (for background bar)
                dateGroups[date].schoolTotals[schoolName] = totalSchoolStudents;
            });

            // Convert to chart format
            const chartData = Object.values(dateGroups)
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

            console.log("Chart data structure:");
            chartData.slice(0, 3).forEach((dataPoint, index) => {
                console.log(`\n📅 Date: ${dataPoint.date}`);
                console.log(`   Total Assessed: ${dataPoint.totalStudents}`);

                // Show background bars (total students per school)
                Object.keys(dataPoint).forEach((key) => {
                    if (key.startsWith("total_")) {
                        const schoolName = key.replace("total_", "");
                        console.log(`   🏫 ${schoolName} - Total Students: ${dataPoint[key]}`);
                    }
                });

                // Show foreground bars (assessed students per school)
                Object.keys(dataPoint).forEach((key) => {
                    if (!key.startsWith("total_") && key !== "date" && key !== "totalStudents") {
                        console.log(`   📊 ${key} - Assessed Students: ${dataPoint[key]}`);
                    }
                });
            });

            // Verify background vs foreground data
            console.log("\n=== Background vs Foreground Verification ===");
            chartData.slice(0, 2).forEach((dataPoint, index) => {
                console.log(`\n📅 ${dataPoint.date}:`);

                const schools = new Set();

                // Collect school names from both background and foreground data
                Object.keys(dataPoint).forEach((key) => {
                    if (key.startsWith("total_")) {
                        schools.add(key.replace("total_", ""));
                    } else if (key !== "date" && key !== "totalStudents") {
                        schools.add(key);
                    }
                });

                schools.forEach((school) => {
                    const totalStudents = dataPoint[`total_${school}`] || 0;
                    const assessedStudents = dataPoint[school] || 0;

                    console.log(`   🏫 ${school}:`);
                    console.log(`      Background (Total): ${totalStudents}`);
                    console.log(`      Foreground (Assessed): ${assessedStudents}`);

                    if (assessedStudents > totalStudents) {
                        console.log(`      ⚠️  WARNING: Assessed > Total!`);
                    } else if (totalStudents > 0) {
                        const percentage = ((assessedStudents / totalStudents) * 100).toFixed(1);
                        console.log(`      📈 Assessment Rate: ${percentage}%`);
                    }
                });
            });
        } else {
            console.log("⚠️  No schedule data available");
        }
    } catch (error) {
        console.error("❌ Error testing background bar chart:", error.message);
    }
}

// Run the test
testBackgroundBarChart();
