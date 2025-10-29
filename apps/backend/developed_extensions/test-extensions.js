// Mock context for testing
const mockContext = {
  registerCommand: async (command, callback) => {
    console.log(`Command registered: ${command}`);
    return {
      dispose: () => console.log(`Command disposed: ${command}`)
    };
  }
};

// Test Hello World Extension
async function testHelloWorld() {
  console.log('\n=== Testing Hello World Extension ===');
  const helloWorld = require('./hello-world');
  
  console.log('1. Activating extension...');
  await helloWorld.onActivate(mockContext);
  
  console.log('2. Testing sayHello command...');
  const result = await helloWorld.sayHello();
  console.log('   Command result:', result);
  
  console.log('3. Deactivating extension...');
  await helloWorld.onDeactivate();
}

// Test File Counter Extension
async function testFileCounter() {
  console.log('\n=== Testing File Counter Extension ===');
  const fileCounter = require('./file-counter');
  
  console.log('1. Activating extension...');
  await fileCounter.onActivate(mockContext);
  
  // Create a test directory
  const fs = require('fs');
  const path = require('path');
  const testDir = path.join(__dirname, 'test-dir');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
    ['file1.txt', 'file2.txt'].forEach(file => {
      fs.writeFileSync(path.join(testDir, file), 'test');
    });
  }
  
  console.log('2. Testing countFiles command...');
  const result = await fileCounter.countFiles({ fsPath: testDir });
  console.log('   File count result:', result);
  
  // Cleanup
  fs.readdirSync(testDir).forEach(file => {
    fs.unlinkSync(path.join(testDir, file));
  });
  fs.rmdirSync(testDir);
  
  console.log('3. Deactivating extension...');
  await fileCounter.onDeactivate();
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Extension Tests\n');
  
  try {
    await testHelloWorld();
    await testFileCounter();
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
