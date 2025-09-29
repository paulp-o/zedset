import fs from 'fs';

// Read both files
const file1 = fs.readFileSync('/Users/paulpark/dev/25/zedset-app/Untitled-1.json', 'utf8');
const file2 = fs.readFileSync('/Users/paulpark/dev/25/zedset-app/Untitled-2.json', 'utf8');

// Parse JSON
const json1 = JSON.parse(file1);
const json2 = JSON.parse(file2);

// Get all unique keys from both objects
const keys1 = Object.keys(json1);
const keys2 = Object.keys(json2);
const allKeys = [...new Set([...keys1, ...keys2])];

console.log('=== DETAILED KEY COMPARISON ===\n');

allKeys.forEach(key => {
    const hasIn1 = keys1.includes(key);
    const hasIn2 = keys2.includes(key);

    if (hasIn1 && hasIn2) {
        const value1 = JSON.stringify(json1[key]);
        const value2 = JSON.stringify(json2[key]);

        if (value1 !== value2) {
            console.log(`🔄 DIFFERENT: ${key}`);
            console.log(`  File 1: ${value1}`);
            console.log(`  File 2: ${value2}`);
        } else {
            console.log(`✅ SAME: ${key}`);
        }
    } else if (hasIn1 && !hasIn2) {
        console.log(`❌ ONLY IN FILE 1: ${key}`);
        console.log(`  Value: ${JSON.stringify(json1[key])}`);
    } else {
        console.log(`❌ ONLY IN FILE 2: ${key}`);
        console.log(`  Value: ${JSON.stringify(json2[key])}`);
    }
    console.log('');
});

console.log('\n=== SUMMARY ===');
console.log(`Total keys in File 1: ${keys1.length}`);
console.log(`Total keys in File 2: ${keys2.length}`);
console.log(`Keys only in File 1: ${keys1.filter(k => !keys2.includes(k)).length}`);
console.log(`Keys only in File 2: ${keys2.filter(k => !keys1.includes(k)).length}`);
console.log(`Keys with different values: ${allKeys.filter(k => keys1.includes(k) && keys2.includes(k) && JSON.stringify(json1[k]) !== JSON.stringify(json2[k])).length}`);
