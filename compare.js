import fs from 'fs';

// Read both files
const file1 = fs.readFileSync('/Users/paulpark/dev/25/zedset-app/Untitled-1.json', 'utf8');
const file2 = fs.readFileSync('/Users/paulpark/dev/25/zedset-app/Untitled-2.json', 'utf8');

// Parse JSON
let json1, json2;
try {
    json1 = JSON.parse(file1);
    json2 = JSON.parse(file2);
} catch (error) {
    console.log('Error parsing JSON:', error.message);
    process.exit(1);
}

// Function to deep compare objects
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== typeof obj2) return false;

    if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
        return obj1 === obj2;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        console.log('Different number of keys:', keys1.length, 'vs', keys2.length);
        return false;
    }

    for (let key of keys1) {
        if (!keys2.includes(key)) {
            console.log('Missing key in second object:', key);
            return false;
        }

        if (!deepEqual(obj1[key], obj2[key])) {
            console.log('Different values for key:', key);
            console.log('  File 1:', JSON.stringify(obj1[key]));
            console.log('  File 2:', JSON.stringify(obj2[key]));
            return false;
        }
    }

    return true;
}

// Compare the parsed JSON objects
const areEqual = deepEqual(json1, json2);

console.log('\n=== COMPARISON RESULT ===');
console.log('Files exactly match:', areEqual);

if (!areEqual) {
    console.log('\n=== DETAILED ANALYSIS ===');

    // Check file sizes
    console.log('File 1 size:', file1.length, 'characters');
    console.log('File 2 size:', file2.length, 'characters');

    // Check if normalized (prettified) versions match
    const normalized1 = JSON.stringify(json1, null, 2);
    const normalized2 = JSON.stringify(json2, null, 2);
    const normalizedMatch = normalized1 === normalized2;

    console.log('Normalized JSONs match:', normalizedMatch);

    if (normalizedMatch) {
        console.log('\nThe files contain identical data but different formatting/whitespace');
    } else {
        console.log('\nThe files contain different data');
    }
}
