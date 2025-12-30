/**
 * Main Runner for All Player Count Implementations
 * Runs all tests for 2-12 players
 */

const { spawn } = require('child_process');
const path = require('path');

class PlayerCountTestRunner {
  constructor() {
    this.testResults = [];
    this.playerCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  /**
   * Run tests for a specific player count
   * @param {number} playerCount - Number of players to test
   * @returns {Promise<Object>} Test result
   */
  async runPlayerCountTest(playerCount) {
    console.log(`\n🎮 Testing ${playerCount}-Player Implementation`);
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const testProcess = spawn('node', [
        path.join(__dirname, `test-${playerCount}-player.js`)
      ], {
        cwd: __dirname,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';
      
      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        const result = {
          playerCount,
          exitCode: code,
          duration,
          success: code === 0,
          stdout,
          stderr,
          summary: this.parseTestOutput(stdout, playerCount)
        };
        
        this.logPlayerCountResult(result);
        resolve(result);
      });
      
      testProcess.on('error', (error) => {
        const duration = Date.now() - startTime;
        const result = {
          playerCount,
          exitCode: -1,
          duration,
          success: false,
          error: error.message,
          summary: { total: 0, passed: 0, failed: 0 }
        };
        
        this.logPlayerCountResult(result);
        resolve(result);
      });
    });
  }

  /**
   * Parse test output to extract summary
   * @param {string} output - Test output
   * @param {number} playerCount - Player count
   * @returns {Object} Test summary
   */
  parseTestOutput(output, playerCount) {
    const lines = output.split('\n');
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    // Parse Mocha output
    lines.forEach(line => {
      if (line.includes(`  ${playerCount}-Player`)) {
        summary.total++;
      } else if (line.includes('✓') || line.includes('✔')) {
        summary.passed++;
      } else if (line.includes('✗') || line.includes('❌') || line.includes('✕')) {
        summary.failed++;
      } else if (line.includes('-')) {
        summary.skipped++;
      }
    });

    return summary;
  }

  /**
   * Log result for specific player count
   * @param {Object} result - Test result
   */
  logPlayerCountResult(result) {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    const duration = (result.duration / 1000).toFixed(2);
    
    console.log(`\n${status} - ${result.playerCount}-Player Tests`);
    console.log(`   Duration: ${duration}s`);
    
    if (result.summary) {
      console.log(`   Tests: ${result.summary.total} total, ${result.summary.passed} passed, ${result.summary.failed} failed`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.stderr && result.stderr.trim()) {
      console.log(`   STDERR: ${result.stderr.trim()}`);
    }
  }

  /**
   * Run tests for all player counts
   * @returns {Promise<Object>} Overall results
   */
  async runAllPlayerCountTests() {
    console.log('🚀 Running All Player Count Implementation Tests');
    console.log('='.repeat(60));
    console.log('Testing UNO implementations for 2-12 players');
    console.log('');

    const startTime = Date.now();

    // Run tests for each player count
    for (const playerCount of this.playerCounts) {
      const result = await this.runPlayerCountTest(playerCount);
      this.testResults.push(result);
      
      // Small delay between test runs
      await this.sleep(100);
    }

    const totalDuration = Date.now() - startTime;
    const summary = this.generateOverallSummary();

    this.printOverallSummary(summary, totalDuration);

    return {
      totalDuration,
      playerCountResults: this.testResults,
      summary
    };
  }

  /**
   * Run tests for specific player counts
   * @param {number[]} playerCounts - Player counts to test
   * @returns {Promise<Object>} Results
   */
  async runSpecificPlayerCountTests(playerCounts) {
    console.log(`🎯 Running Tests for Player Counts: ${playerCounts.join(', ')}`);
    console.log('='.repeat(60));

    const startTime = Date.now();
    const results = [];

    for (const playerCount of playerCounts) {
      const result = await this.runPlayerCountTest(playerCount);
      results.push(result);
      await this.sleep(100);
    }

    const totalDuration = Date.now() - startTime;
    const summary = this.generateOverallSummaryFromResults(results);

    this.printOverallSummary(summary, totalDuration);

    return {
      totalDuration,
      playerCountResults: results,
      summary
    };
  }

  /**
   * Generate overall summary from all test results
   * @returns {Object} Overall summary
   */
  generateOverallSummary() {
    const summary = {
      totalPlayerCounts: this.testResults.length,
      passedPlayerCounts: 0,
      failedPlayerCounts: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      passed: []
    };

    this.testResults.forEach(result => {
      if (result.success) {
        summary.passedPlayerCounts++;
        summary.passed.push(result.playerCount);
      } else {
        summary.failedPlayerCounts++;
      }

      if (result.summary) {
        summary.totalTests += result.summary.total;
        summary.totalPassed += result.summary.passed;
        summary.totalFailed += result.summary.failed;
        summary.totalSkipped += result.summary.skipped;
      }
    });

    summary.successRate = ((summary.passedPlayerCounts / summary.totalPlayerCounts) * 100).toFixed(1);
    summary.testSuccessRate = summary.totalTests > 0 
      ? ((summary.totalPassed / summary.totalTests) * 100).toFixed(1)
      : '0.0';

    return summary;
  }

  /**
   * Generate overall summary from specific results
   * @param {Array} results - Test results
   * @returns {Object} Overall summary
   */
  generateOverallSummaryFromResults(results) {
    const summary = {
      totalPlayerCounts: results.length,
      passedPlayerCounts: 0,
      failedPlayerCounts: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      passed: []
    };

    results.forEach(result => {
      if (result.success) {
        summary.passedPlayerCounts++;
        summary.passed.push(result.playerCount);
      } else {
        summary.failedPlayerCounts++;
      }

      if (result.summary) {
        summary.totalTests += result.summary.total;
        summary.totalPassed += result.summary.passed;
        summary.totalFailed += result.summary.failed;
        summary.totalSkipped += result.summary.skipped;
      }
    });

    summary.successRate = ((summary.passedPlayerCounts / summary.totalPlayerCounts) * 100).toFixed(1);
    summary.testSuccessRate = summary.totalTests > 0 
      ? ((summary.totalPassed / summary.totalTests) * 100).toFixed(1)
      : '0.0';

    return summary;
  }

  /**
   * Print overall summary
   * @param {Object} summary - Overall summary
   * @param {number} totalDuration - Total duration
   */
  printOverallSummary(summary, totalDuration) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 OVERALL TEST SUMMARY');
    console.log('='.repeat(60));

    console.log(`\nPlayer Count Implementations:`);
    console.log(`   Total: ${summary.totalPlayerCounts}`);
    console.log(`   Passed: ${summary.passedPlayerCounts} (${summary.successRate}%)`);
    console.log(`   Failed: ${summary.failedPlayerCounts}`);

    if (summary.passed.length > 0) {
      console.log(`   ✅ Passed: ${summary.passed.join(', ')}-player implementations`);
    }

    if (summary.totalTests > 0) {
      console.log(`\nIndividual Tests:`);
      console.log(`   Total: ${summary.totalTests}`);
      console.log(`   Passed: ${summary.totalPassed} (${summary.testSuccessRate}%)`);
      console.log(`   Failed: ${summary.totalFailed}`);
      console.log(`   Skipped: ${summary.totalSkipped}`);
    }

    console.log(`\n⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    if (summary.failedPlayerCounts === 0) {
      console.log('\n🎉 ALL PLAYER COUNT IMPLEMENTATIONS PASSED!');
      console.log('🏆 Ready for production use!');
    } else {
      console.log('\n⚠️  Some implementations failed.');
      console.log('🔧 Check the detailed logs above for issues.');
    }
  }

  /**
   * Sleep helper
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate specific player count implementations
   * @param {number[]} playerCounts - Player counts to validate
   */
  async validatePlayerCountImplementations(playerCounts = this.playerCounts) {
    console.log('🔍 Validating Player Count Implementations');
    console.log('='.repeat(50));

    const validationResults = [];

    for (const playerCount of playerCounts) {
      console.log(`\n📋 Validating ${playerCount}-Player Implementation...`);
      
      try {
        const UnoGameClass = require(`../../player-count-rules/UnoGame${playerCount}Player`);
        const game = new UnoGameClass();
        
        const result = {
          playerCount,
          className: `UnoGame${playerCount}Player`,
          valid: true,
          errors: [],
          rules: game.getPlayerCountRules()
        };

        // Basic validation
        if (!game.playerCount || game.playerCount !== playerCount) {
          result.valid = false;
          result.errors.push(`playerCount should be ${playerCount}, got ${game.playerCount}`);
        }

        if (!game.createDeck) {
          result.valid = false;
          result.errors.push('Missing createDeck method');
        }

        if (!game.createRoom) {
          result.valid = false;
          result.errors.push('Missing createRoom method');
        }

        if (!game.playCard) {
          result.valid = false;
          result.errors.push('Missing playCard method');
        }

        if (result.valid) {
          console.log(`✅ ${playerCount}-Player: VALID`);
        } else {
          console.log(`❌ ${playerCount}-Player: INVALID`);
          result.errors.forEach(error => console.log(`   - ${error}`));
        }

        validationResults.push(result);

      } catch (error) {
        console.log(`💥 ${playerCount}-Player: FAILED TO LOAD`);
        console.log(`   Error: ${error.message}`);
        
        validationResults.push({
          playerCount,
          className: `UnoGame${playerCount}Player`,
          valid: false,
          errors: [`Failed to load: ${error.message}`],
          rules: null
        });
      }

      await this.sleep(50);
    }

    const validCount = validationResults.filter(r => r.valid).length;
    const invalidCount = validationResults.length - validCount;

    console.log('\n' + '='.repeat(50));
    console.log('📋 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Valid implementations: ${validCount}`);
    console.log(`Invalid implementations: ${invalidCount}`);
    console.log(`Total implementations: ${validationResults.length}`);

    if (invalidCount > 0) {
      console.log('\n❌ Invalid implementations:');
      validationResults
        .filter(r => !r.valid)
        .forEach(r => {
          console.log(`   ${r.playerCount}-Player (${r.className}):`);
          r.errors.forEach(error => console.log(`     - ${error}`));
        });
    }

    return validationResults;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const runner = new PlayerCountTestRunner();

  if (args.includes('--validate')) {
    // Just validate implementations
    const playerCounts = [];
    const playersIndex = args.indexOf('--players');
    if (playersIndex !== -1) {
      const counts = args[playersIndex + 1];
      playerCounts.push(...counts.split(',').map(n => parseInt(n.trim())));
    } else {
      playerCounts.push(...runner.playerCounts);
    }
    
    await runner.validatePlayerCountImplementations(playerCounts);
    
  } else if (args.includes('--players')) {
    // Run tests for specific player counts
    const playersIndex = args.indexOf('--players');
    const counts = args[playersIndex + 1];
    const playerCounts = counts.split(',').map(n => parseInt(n.trim()));
    
    await runner.runSpecificPlayerCountTests(playerCounts);
    
  } else {
    // Run all tests
    await runner.runAllPlayerCountTests();
  }
}

// Handle command line arguments
function printUsage() {
  console.log('🎮 UNO Player Count Test Runner');
  console.log('');
  console.log('Usage:');
  console.log('  node run-all-player-tests.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --validate              Validate implementations without running tests');
  console.log('  --players 2,3,4       Run tests for specific player counts');
  console.log('');
  console.log('Examples:');
  console.log('  node run-all-player-tests.js                    # Run all tests');
  console.log('  node run-all-player-tests.js --validate           # Validate all implementations');
  console.log('  node run-all-player-tests.js --players 2,3,4   # Test 2, 3, and 4 player implementations');
}

// Check for help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = PlayerCountTestRunner;