// Test Delete Student API
// Jalankan di browser console atau di terminal dengan node

const testDeleteStudent = async (studentId, cascade = false) => {
    try {
        const url = cascade 
            ? `http://localhost:3000/api/students/${studentId}?cascade=true`
            : `http://localhost:3000/api/students/${studentId}`;
            
        console.log(`Testing DELETE: ${url}`);
        
        const response = await fetch(url, {
            method: 'DELETE',
        });
        
        const result = await response.json();
        
        console.log('Status:', response.status);
        console.log('Response:', result);
        
        return result;
        
    } catch (error) {
        console.error('Test Error:', error);
    }
};

// Test check relations
const testCheckRelations = async (studentId) => {
    try {
        const response = await fetch(`http://localhost:3000/api/students/${studentId}/check-relations`);
        const result = await response.json();
        
        console.log('Check Relations Result:', result);
        return result;
        
    } catch (error) {
        console.error('Check Relations Error:', error);
    }
};

// Usage examples:
// 1. Check if student has relations:
// testCheckRelations(1);

// 2. Try delete without cascade:
// testDeleteStudent(1, false);

// 3. Try delete with cascade:
// testDeleteStudent(1, true);

console.log('Test functions loaded. Use:');
console.log('- testCheckRelations(studentId)');
console.log('- testDeleteStudent(studentId, cascade)');
