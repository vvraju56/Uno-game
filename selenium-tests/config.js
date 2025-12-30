/**
 * Selenium Test Configuration
 */

const { Builder, until, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class TestConfig {
  constructor() {
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
    this.defaultTimeout = 10000; // 10 seconds
    this.longTimeout = 30000; // 30 seconds
  }

  /**
   * Create a new WebDriver instance
   * @param {Object} options - Chrome options
   * @returns {WebDriver} WebDriver instance
   */
  createDriver(options = {}) {
    const chromeOptions = new chrome.Options();
    
    // Headless mode for CI/CD
    if (process.env.CI || process.env.HEADLESS) {
      chromeOptions.addArguments('--headless');
    }
    
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');
    
    if (options.userAgent) {
      chromeOptions.addArguments(`--user-agent=${options.userAgent}`);
    }

    return new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  }

  /**
   * Wait for element to be visible
   * @param {WebDriver} driver - WebDriver instance
   * @param {string} locator - Element locator
   * @param {number} timeout - Custom timeout
   */
  async waitForElement(driver, locator, timeout = this.defaultTimeout) {
    return await driver.wait(until.elementLocated(locator), timeout);
  }

  /**
   * Wait for element to be clickable
   * @param {WebDriver} driver - WebDriver instance
   * @param {string} locator - Element locator
   * @param {number} timeout - Custom timeout
   */
  async waitForClickable(driver, locator, timeout = this.defaultTimeout) {
    return await driver.wait(until.elementIsEnabled(driver.findElement(locator)), timeout);
  }

  /**
   * Take screenshot for debugging
   * @param {WebDriver} driver - WebDriver instance
   * @param {string} filename - Screenshot filename
   */
  async takeScreenshot(driver, filename) {
    try {
      const screenshot = await driver.takeScreenshot();
      const fs = require('fs');
      fs.writeFileSync(filename, screenshot, 'base64');
      console.log(`Screenshot saved: ${filename}`);
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  }

  /**
   * Clean up driver
   * @param {WebDriver} driver - WebDriver instance
   */
  async quitDriver(driver) {
    try {
      await driver.quit();
    } catch (error) {
      console.error('Error quitting driver:', error);
    }
  }
}

module.exports = TestConfig;