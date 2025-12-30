/**
 * Main Test Runner for UNO Power Card Tests
 * Runs all Selenium tests for 2-12 players
 */

const PowerCardTestSuite = require('./power-cards/PowerCardTestSuite');

async function runAllTests() {
  console.log('🎮 UNO Power Card Test Suite');
  console.log('==================================');
  console.log('Testing authoritative power card rules for 2-12 players');
  console.log('');

  const testSuite = new PowerCardTestSuite();

  try {
    // Check if server is running
    console.log('📡 Checking if UNO server is running...');
    const serverAvailable = await checkServerAvailability();
    
    if (!serverAvailable) {
      console.log('❌ UNO server is not running. Please start the server first:');
      console.log('   npm run start-for-testing');
      console.log('   OR');
      console.log('   node server.js');
      process.exit(1);
    }
    
    console.log('✅ Server is available');
    console.log('');

    // Run all tests
    await testSuite.runAllTests();
    
    console.log('\n🎊 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Check if UNO server is available
 * @returns {boolean} True if server is responding
 */
async function checkServerAvailability() {
  try {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        resolve(res.statusCode < 500);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
    
  } catch (error) {
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, checkServerAvailability };