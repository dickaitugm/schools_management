const fetch = require("node-fetch");

async function testStackedAssessmentChart() {
    try {
        console.log("=== Testing Stacked Assessment Chart Data ===");

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
                const notAssessed = schedule.total_school_students - schedule.student_count;
                console.log(`   Not Assessed Students: ${notAssessed}`);
                console.log("");
            });

            // Simulate data processing for stacked assessment chart
            console.log("\n=== Processed Stacked Assessment Chart Data ===");
            const scheduleData = result.data.scheduleData;

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
            const chartData = Object.values(dateGroups)
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

            console.log("Stacked chart data structure:");
            chartData.slice(0, 3).forEach((dataPoint, index) => {
                console.log(`\n📅 Date: ${dataPoint.date}`);

                // Show stacked data for each school
                Object.keys(dataPoint).forEach((key) => {
                    if (key.endsWith("_assessed")) {
                        const school = key.replace("_assessed", "");
                        const assessed = dataPoint[key];
                        const notAssessed = dataPoint[`${school}_not_assessed`] || 0;
                        const total = assessed + notAssessed;

                        console.log(`\n🏫 ${school}:`);
                        console.log(`   📊 Stack Bottom (Assessed): ${assessed}`);
                        console.log(`   📊 Stack Top (Not Assessed): ${notAssessed}`);
                        console.log(`   📈 Total Students: ${total}`);

                        if (total > 0) {
                            const assessmentRate = ((assessed / total) * 100).toFixed(1);
                            console.log(`   🎯 Assessment Rate: ${assessmentRate}%`);
                        }
                    }
                });
            });

            // Verify stacked data logic
            console.log("\n=== Stacked Data Verification ===");
            const schools = new Set();

            // Collect all unique schools
            chartData.forEach((dataPoint) => {
                Object.keys(dataPoint).forEach((key) => {
                    if (key.endsWith("_assessed")) {
                        schools.add(key.replace("_assessed", ""));
                    }
                });
            });

            console.log(`\n🏫 Schools in chart: ${Array.from(schools).join(", ")}`);

            chartData.slice(0, 2).forEach((dataPoint, index) => {
                console.log(`\n📅 ${dataPoint.date} - Verification:`);

                schools.forEach((school) => {
                    const assessed = dataPoint[`${school}_assessed`] || 0;
                    const notAssessed = dataPoint[`${school}_not_assessed`] || 0;
                    const total = assessed + notAssessed;

                    if (total > 0) {
                        console.log(`   ${school}:`);
                        console.log(`     ✅ Assessed: ${assessed} (bottom stack)`);
                        console.log(`     ⏳ Not Assessed: ${notAssessed} (top stack)`);
                        console.log(`     🔢 Total: ${total}`);

                        if (assessed < 0 || notAssessed < 0) {
                            console.log(`     ⚠️  WARNING: Negative values detected!`);
                        }
                    }
                });
            });
        } else {
            console.log("⚠️  No schedule data available");
        }
    } catch (error) {
        console.error("❌ Error testing stacked assessment chart:", error.message);
    }
}

// Run the test
testStackedAssessmentChart();
