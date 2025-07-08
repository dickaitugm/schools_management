// Test Y-axis ticks calculation for dashboard chart
// This script tests the new Y-axis calculation logic to ensure no duplicate ticks

console.log('=== Testing Y-axis Ticks Calculation ===');

// Function to calculate Y-axis ticks (mirroring Dashboard.js logic)
const calculateYAxisTicks = (max) => {
    // Find a nice round number that's higher than max
    let step;
    if (max <= 5) step = 1;
    else if (max <= 10) step = 2;
    else if (max <= 20) step = 5;
    else if (max <= 50) step = 10;
    else if (max <= 100) step = 20;
    else if (max <= 200) step = 50;
    else step = Math.ceil(max / 5 / 10) * 10;
    
    const roundedMax = Math.ceil(max / step) * step;
    const ticks = [];
    for (let i = 0; i <= 5; i++) {
        ticks.push((roundedMax * (5 - i)) / 5);
    }
    return { ticks, roundedMax, step };
};

// Test cases with different max values
const testCases = [
    3, 5, 8, 12, 15, 25, 35, 48, 65, 85, 120, 180, 250, 350, 500
];

testCases.forEach(maxValue => {
    const { ticks, roundedMax, step } = calculateYAxisTicks(maxValue);
    const roundedTicks = ticks.map(tick => Math.round(tick));
    
    console.log(`\nMax Value: ${maxValue}`);
    console.log(`Step: ${step}`);
    console.log(`Rounded Max: ${roundedMax}`);
    console.log(`Raw Ticks: [${ticks.join(', ')}]`);
    console.log(`Rounded Ticks: [${roundedTicks.join(', ')}]`);
    
    // Check for duplicates
    const uniqueTicks = [...new Set(roundedTicks)];
    const hasDuplicates = uniqueTicks.length !== roundedTicks.length;
    
    if (hasDuplicates) {
        console.log('❌ DUPLICATES FOUND!');
    } else {
        console.log('✅ No duplicates');
    }
    
    // Check if ticks are in descending order
    const isDescending = roundedTicks.every((tick, i) => 
        i === 0 || roundedTicks[i-1] >= tick
    );
    
    if (!isDescending) {
        console.log('❌ NOT IN DESCENDING ORDER!');
    } else {
        console.log('✅ Descending order');
    }
});

console.log('\n=== Test Complete ===');
