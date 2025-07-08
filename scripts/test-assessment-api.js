async function testAssessmentAPI() {
  try {
    console.log('Testing Assessment API for Schedule ID 7...\n');
    
    const response = await fetch('http://localhost:3000/api/schedules/7/assessment');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Response Success');
      console.log('Schedule:', data.data.schedule);
      console.log('Total students:', data.data.students.length);
      
      console.log('\n--- Students Data ---');
      data.data.students.forEach((student, index) => {
        console.log(`Student ${index + 1}:`);
        console.log(`  Name: ${student.name}`);
        console.log(`  Attendance ID: ${student.attendance_id}`);
        console.log(`  Personal Dev: ${student.personal_development_level}`);
        console.log(`  Critical Thinking: ${student.critical_thinking_level}`);
        console.log(`  Team Work: ${student.team_work_level}`);
        console.log(`  Academic Knowledge: ${student.academic_knowledge_level}`);
        console.log('');
      });
      
      // Filter assessed students
      const assessedStudents = data.data.students.filter(student => 
        student.attendance_id && 
        (student.personal_development_level || 
         student.critical_thinking_level || 
         student.team_work_level || 
         student.academic_knowledge_level)
      );
      
      console.log(`Assessed students count: ${assessedStudents.length}`);
      
    } else {
      console.error('❌ API Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testAssessmentAPI();
