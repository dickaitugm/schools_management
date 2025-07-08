const { Pool } = require('pg');
require('dotenv').config();

// Test the improved Y-axis calculation
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
    const uniqueTicks = [...new Set(ticks)].sort((a, b) => b - a);
    
    return { ticks: uniqueTicks, roundedMax };
};

console.log('=== Testing Fixed Y-axis Ticks Calculation ===');

const testValues = [3, 5, 8, 12, 15, 25, 35, 48, 65, 85, 120, 180, 250, 350, 500];

testValues.forEach(maxValue => {
    const { ticks, roundedMax } = calculateYAxisTicks(maxValue);
    
    console.log(`Max Value: ${maxValue}`);
    console.log(`Rounded Max: ${roundedMax}`);
    console.log(`Ticks: [${ticks.join(', ')}]`);
    
    // Check for duplicates
    const hasDuplicates = ticks.length !== new Set(ticks).size;
    if (hasDuplicates) {
        console.log('❌ DUPLICATES FOUND!');
    } else {
        console.log('✅ No duplicates');
    }
    
    // Check if descending order
    const isDescending = ticks.every((val, i) => i === 0 || val <= ticks[i - 1]);
    if (isDescending) {
        console.log('✅ Descending order');
    } else {
        console.log('❌ NOT in descending order');
    }
    
    console.log('---');
});

console.log('=== Test Complete ===');
