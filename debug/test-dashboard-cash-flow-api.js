// Test script to verify dashboard cash flow API response
async function testDashboardCashFlow() {
  try {
    console.log('🧪 Testing Dashboard Cash Flow API...\n');

    const response = await fetch('http://localhost:3000/api/dashboard');
    const data = await response.json();

    if (data.success) {
      console.log('✅ Dashboard API Response:');
      
      console.log('\n📊 Recent Cash Flow:');
      if (data.data.recentCashFlow && data.data.recentCashFlow.length > 0) {
        console.log('Date       | Type    | Amount      | Running Balance | Description');
        console.log('-----------|---------|-------------|-----------------|-------------');
        
        data.data.recentCashFlow.forEach(tx => {
          const date = tx.transaction_date.split('T')[0];
          const type = tx.transaction_type.padEnd(7);
          const amount = `Rp ${parseFloat(tx.amount).toLocaleString('id-ID')}`.padEnd(11);
          const balance = `Rp ${parseFloat(tx.running_balance).toLocaleString('id-ID')}`.padEnd(15);
          const desc = tx.description.substring(0, 30);
          console.log(`${date} | ${type} | ${amount} | ${balance} | ${desc}`);
        });
        
        // Check if the latest transaction shows the current total balance
        const latestTx = data.data.recentCashFlow[0]; // First in the array (most recent)
        console.log(`\n💰 Current Total Balance (from latest transaction): Rp ${parseFloat(latestTx.running_balance).toLocaleString('id-ID')}`);
      } else {
        console.log('❌ No cash flow data found');
      }

      console.log('\n📈 Basic Stats:');
      console.log(`Students: ${data.data.total_students}`);
      console.log(`Teachers: ${data.data.total_teachers}`);
      console.log(`Schools: ${data.data.total_schools}`);
      console.log(`Schedules: ${data.data.total_schedules}`);
      console.log(`Lessons: ${data.data.total_lessons}`);

    } else {
      console.log('❌ API Error:', data.error);
    }

  } catch (error) {
    console.error('❌ Error testing dashboard API:', error);
  }
}

testDashboardCashFlow();
