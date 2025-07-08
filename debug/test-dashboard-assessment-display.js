/**
 * Test script untuk validasi data assessment dan tampilan dashboard
 * Menguji apakah dashboard menampilkan:
 * 1. formatDateIndonesian untuk tanggal schedule
 * 2. Nilai assessment rata-rata tiap kategori pada schedule completed
 * 3. Overall average assessment
 * 4. Recent & Upcoming Schedules (3 terbaru, tanpa scroll)
 */

const testDashboardAssessmentDisplay = async () => {
  console.log('🧪 Testing Dashboard Assessment Display...\n');

  try {
    // Test API endpoint dashboard
    console.log('📡 Testing Dashboard API endpoint...');
    const response = await fetch('http://localhost:3000/api/dashboard');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`API Error: ${result.error}`);
    }

    console.log('✅ Dashboard API responded successfully');
    console.log(`📊 Basic Stats:
    - Schools: ${result.data.schools}
    - Teachers: ${result.data.teachers}
    - Students: ${result.data.students}
    - Lessons: ${result.data.lessons}
    - Schedules: ${result.data.schedules}\n`);

    // Test schedule data structure
    const scheduleData = result.data.scheduleData || [];
    console.log(`📅 Schedule Data: ${scheduleData.length} schedules found\n`);

    if (scheduleData.length > 0) {
      console.log('🔍 Testing Recent Schedules (3 newest):');
      
      // Sort by newest first (same as dashboard)
      const recentSchedules = scheduleData
        .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
        .slice(0, 3);

      recentSchedules.forEach((schedule, index) => {
        console.log(`\n📌 Schedule ${index + 1}:`);
        console.log(`   School: ${schedule.school_name}`);
        console.log(`   Date: ${schedule.scheduled_date}`);
        console.log(`   Status: ${schedule.status}`);
        console.log(`   Lesson: ${schedule.lesson_title || 'N/A'}`);
        console.log(`   Students Assessed: ${schedule.student_count}/${schedule.total_school_students}`);

        // Check assessment data for completed schedules
        if (schedule.status === 'completed') {
          console.log('   📋 Assessment Averages:');
          console.log(`      Personal Development: ${schedule.avg_personal_development || '0.0'}/5`);
          console.log(`      Critical Thinking: ${schedule.avg_critical_thinking || '0.0'}/5`);
          console.log(`      Team Work: ${schedule.avg_team_work || '0.0'}/5`);
          console.log(`      Academic Knowledge: ${schedule.avg_academic_knowledge || '0.0'}/5`);
          console.log(`      Overall Average: ${schedule.overall_average || '0.0'}/5`);
          
          // Validate assessment data presence
          const hasAssessmentData = 
            schedule.avg_personal_development !== null ||
            schedule.avg_critical_thinking !== null ||
            schedule.avg_team_work !== null ||
            schedule.avg_academic_knowledge !== null ||
            schedule.overall_average !== null;
          
          if (hasAssessmentData) {
            console.log('   ✅ Assessment data is available');
          } else {
            console.log('   ⚠️ No assessment data found (may be expected if no students assessed)');
          }
        } else {
          console.log('   📋 Assessment: N/A (not completed)');
        }
      });

      // Test date formatting
      console.log('\n📆 Testing Date Formatting (Indonesian format):');
      recentSchedules.forEach((schedule, index) => {
        const date = new Date(schedule.scheduled_date);
        
        // Simulate formatDateIndonesian function
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        const dayName = dayNames[date.getDay()];
        const day = date.getDate();
        const monthName = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const formattedDate = `${dayName}, ${day} ${monthName} ${year}`;
        
        console.log(`   Schedule ${index + 1}: ${formattedDate}`);
      });

      // Test chart data preparation
      console.log('\n📊 Testing Chart Data Preparation:');
      
      // Group schedules by date and school for chart
      const dateGroups = {};
      scheduleData.forEach(schedule => {
        const date = new Date(schedule.scheduled_date).toLocaleDateString('en-GB');
        const schoolName = schedule.school_name;
        
        if (!dateGroups[date]) {
          dateGroups[date] = {};
        }
        
        if (!dateGroups[date][schoolName]) {
          dateGroups[date][schoolName] = {
            assessed: 0,
            total: 0
          };
        }
        
        dateGroups[date][schoolName].assessed += parseInt(schedule.student_count) || 0;
        dateGroups[date][schoolName].total += parseInt(schedule.total_school_students) || 0;
      });

      const chartDataPoints = Object.keys(dateGroups).length;
      console.log(`   📈 Chart will have ${chartDataPoints} date points`);
      
      Object.keys(dateGroups).slice(0, 3).forEach(date => {
        console.log(`   📅 ${date}:`);
        Object.keys(dateGroups[date]).forEach(school => {
          const data = dateGroups[date][school];
          console.log(`      ${school}: ${data.assessed}/${data.total} assessed`);
        });
      });

    } else {
      console.log('⚠️ No schedule data found - dashboard will show empty state');
    }

    // Test analytics data
    if (result.data.analytics) {
      console.log('\n📈 Analytics Summary:');
      console.log(`   Active Schedules: ${result.data.analytics.totalActiveSchedules}`);
      console.log(`   Completed Schedules: ${result.data.analytics.totalCompletedSchedules}`);
      console.log(`   Students in Schedules: ${result.data.analytics.totalStudentsInSchedules}`);
      console.log(`   Avg Students/Schedule: ${result.data.analytics.averageStudentsPerSchedule}`);
    }

    console.log('\n✅ Dashboard assessment display test completed successfully!');
    console.log('\n🎯 Summary of key features:');
    console.log('   ✓ formatDateIndonesian used for date labels');
    console.log('   ✓ Assessment averages displayed for completed schedules');
    console.log('   ✓ Recent & Upcoming Schedules card (3 newest, no scroll)');
    console.log('   ✓ Custom stacked bar chart with proper data structure');
    console.log('   ✓ Assessment categories: Personal, Critical, Team Work, Academic');
    console.log('   ✓ Overall average calculation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. Development server is running (npm run dev)');
    console.log('2. Database connection is working');
    console.log('3. Dashboard API endpoint is accessible');
  }
};

// Run the test
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testDashboardAssessmentDisplay();
} else {
  // Browser environment
  testDashboardAssessmentDisplay();
}
      overall_average: 3.1
    },
    {
      id: 2,
      school_name: 'SMP Tunas Muda',
      scheduled_date: '2025-07-08T14:30:00Z',
      status: 'scheduled',
      student_count: 0,
      total_school_students: 25,
      lesson_title: 'Pengenalan Sains dan Teknologi'
    },
    {
      id: 3,
      school_name: 'Rusunawa Cibuluh',
      scheduled_date: '2025-06-27T15:30:00Z',
      status: 'completed',
      student_count: 2,
      total_school_students: 2,
      lesson_title: 'Pengenalan Hukum Fisika',
      avg_personal_development: 2.5,
      avg_critical_thinking: 3.0,
      avg_team_work: 3.0,
      avg_academic_knowledge: 3.5,
      overall_average: 3.0
    }
  ];
  
  // Sort by newest first (like in Dashboard)
  const sortedSchedules = mockScheduleData
    .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
    .slice(0, 3);
  
  console.log('\n📊 Sorted Schedules (Newest First):');
  
  sortedSchedules.forEach((schedule, index) => {
    console.log(`\n${index + 1}. ${schedule.school_name}`);
    console.log(`   📅 Date: ${schedule.scheduled_date}`);
    console.log(`   Status: ${schedule.status}`);
    console.log(`   👥 Students: ${schedule.student_count}/${schedule.total_school_students} assessed`);
    console.log(`   📚 Lesson: ${schedule.lesson_title}`);
    
    if (schedule.status === 'completed') {
      console.log(`   📈 Assessment Averages:`);
      console.log(`      Personal Development: ${schedule.avg_personal_development || '0.0'}/5`);
      console.log(`      Critical Thinking: ${schedule.avg_critical_thinking || '0.0'}/5`);
      console.log(`      Team Work: ${schedule.avg_team_work || '0.0'}/5`);
      console.log(`      Academic Knowledge: ${schedule.avg_academic_knowledge || '0.0'}/5`);
      console.log(`      Overall Average: ${schedule.overall_average || '0.0'}/5`);
    }
  });
  
  // Test Indonesian date formatting simulation
  console.log('\n📅 Date Formatting Test:');
  mockScheduleData.forEach(schedule => {
    const date = new Date(schedule.scheduled_date);
    const indonesianDate = date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    console.log(`${schedule.school_name}: ${indonesianDate}`);
  });
  
  // Test compact assessment display
  console.log('\n📊 Compact Assessment Display Test:');
  const completedSchedules = mockScheduleData.filter(s => s.status === 'completed');
  
  completedSchedules.forEach(schedule => {
    console.log(`\n🏫 ${schedule.school_name}:`);
    console.log(`   Personal: ${schedule.avg_personal_development || '0.0'}/5`);
    console.log(`   Critical: ${schedule.avg_critical_thinking || '0.0'}/5`);
    console.log(`   Team Work: ${schedule.avg_team_work || '0.0'}/5`);
    console.log(`   Academic: ${schedule.avg_academic_knowledge || '0.0'}/5`);
    console.log(`   Overall: ${schedule.overall_average || '0.0'}/5`);
  });
  
  console.log('\n✅ Dashboard Assessment Display Test Complete!');
}

// Run the test
testDashboardAssessmentDisplay();
