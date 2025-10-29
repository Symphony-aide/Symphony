console.log('🔍 Testing Symphony Extensions...\n');

// Test Hello World
console.log('=== Testing Hello World Extension ===');
const helloWorld = require('./hello-world');
console.log('1. Activating extension...');
helloWorld.onActivate();
console.log('2. Running hello command...');
const helloResult = helloWorld.commands.hello();
console.log('   Result:', helloResult);
console.log('3. Deactivating extension...');
helloWorld.onDeactivate();

// Test File Counter
console.log('\n=== Testing File Counter Extension ===');
const fs = require('fs');
const path = require('path');
const fileCounter = require('./file-counter');

// Create a test directory
const testDir = path.join(__dirname, 'test-dir');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
    ['file1.txt', 'file2.txt'].forEach(file => {
        fs.writeFileSync(path.join(testDir, file), 'test');
    });
}

console.log('1. Counting files in test directory...');
fileCounter.commands['count-files'](testDir)
    .then(result => {
        console.log('   Result:', result);
        
        // Cleanup
        fs.readdirSync(testDir).forEach(file => {
            fs.unlinkSync(path.join(testDir, file));
        });
        fs.rmdirSync(testDir);
    })
    .catch(console.error);

// Test Command Palette
console.log('\n=== Testing Command Palette Extension ===');
const commandPalette = require('./command-palette');
console.log('1. Getting current time...');
console.log('   Time:', commandPalette.commands.time().time);
console.log('2. Testing greeting...');
console.log('   Greeting:', commandPalette.commands.greet('المستخدم').message);

console.log('\n✅ All tests completed!');
