/**
 * UNO Game Test Helper for Selenium
 * Contains helper methods to interact with the UNO game UI
 */

const { By, until } = require('selenium-webdriver');

class UnoGameTestHelper {
  constructor(driver, config) {
    this.driver = driver;
    this.config = config;
  }

  /**
   * Navigate to the UNO game page
   */
  async navigateToGame() {
    await this.driver.get(this.config.baseUrl);
  }

  /**
   * Create a new game room
   * @param {string} playerName - Player name
   * @returns {string} Room ID
   */
  async createRoom(playerName) {
    // Click "Create Room" button
    const createRoomBtn = await this.config.waitForElement(this.driver, By.id('create-room-btn'));
    await createRoomBtn.click();

    // Enter player name
    const nameInput = await this.config.waitForElement(this.driver, By.id('player-name-input'));
    await nameInput.clear();
    await nameInput.sendKeys(playerName);

    // Confirm room creation
    const confirmBtn = await this.config.waitForElement(this.driver, By.id('confirm-create-room'));
    await confirmBtn.click();

    // Wait for room to be created and get room ID
    await this.config.waitForElement(this.driver, By.id('room-id'));
    const roomIdElement = await this.driver.findElement(By.id('room-id'));
    const roomId = await roomIdElement.getText();
    
    return roomId;
  }

  /**
   * Join an existing game room
   * @param {string} roomId - Room ID to join
   * @param {string} playerName - Player name
   */
  async joinRoom(roomId, playerName) {
    // Click "Join Room" button
    const joinRoomBtn = await this.config.waitForElement(this.driver, By.id('join-room-btn'));
    await joinRoomBtn.click();

    // Enter room ID
    const roomIdInput = await this.config.waitForElement(this.driver, By.id('room-id-input'));
    await roomIdInput.clear();
    await roomIdInput.sendKeys(roomId);

    // Enter player name
    const nameInput = await this.config.waitForElement(this.driver, By.id('player-name-input'));
    await nameInput.clear();
    await nameInput.sendKeys(playerName);

    // Confirm joining room
    const confirmBtn = await this.config.waitForElement(this.driver, By.id('confirm-join-room'));
    await confirmBtn.click();

    // Wait to be in room
    await this.config.waitForElement(this.driver, By.id('game-room'));
  }

  /**
   * Start the game (host only)
   */
  async startGame() {
    const startGameBtn = await this.config.waitForClickable(this.driver, By.id('start-game-btn'));
    await startGameBtn.click();

    // Wait for game to start
    await this.config.waitForElement(this.driver, By.id('game-board'));
  }

  /**
   * Play a card from hand
   * @param {string} cardId - ID of the card to play
   */
  async playCard(cardId) {
    const cardElement = await this.config.waitForElement(this.driver, By.id(`card-${cardId}`));
    await cardElement.click();

    // Wait for play confirmation (if needed)
    const playConfirmBtn = await this.driver.findElement(By.id('confirm-play-card')).catch(() => null);
    if (playConfirmBtn) {
      await playConfirmBtn.click();
    }
  }

  /**
   * Choose a color for wild card
   * @param {string} color - Color to choose (red, blue, green, yellow)
   */
  async chooseWildColor(color) {
    const colorBtn = await this.config.waitForElement(this.driver, By.id(`choose-${color}`));
    await colorBtn.click();
  }

  /**
   * Draw a card
   */
  async drawCard() {
    const drawBtn = await this.config.waitForClickable(this.driver, By.id('draw-card-btn'));
    await drawBtn.click();
  }

  /**
   * Call UNO
   */
  async callUno() {
    const unoBtn = await this.config.waitForClickable(this.driver, By.id('uno-btn'));
    await unoBtn.click();
  }

  /**
   * Get current player information
   * @returns {Object} Current player data
   */
  async getCurrentPlayer() {
    const currentPlayerElement = await this.config.waitForElement(this.driver, By.id('current-player'));
    const currentPlayerText = await currentPlayerElement.getText();
    
    return {
      name: currentPlayerText,
      handCount: await this.getHandCount(),
      isMyTurn: await this.isMyTurn()
    };
  }

  /**
   * Get number of cards in current player's hand
   * @returns {number} Hand count
   */
  async getHandCount() {
    const handElement = await this.config.waitForElement(this.driver, By.id('player-hand'));
    const cards = await handElement.findElements(By.className('card'));
    return cards.length;
  }

  /**
   * Check if it's current player's turn
   * @returns {boolean} True if it's current player's turn
   */
  async isMyTurn() {
    const turnIndicator = await this.driver.findElement(By.id('turn-indicator')).catch(() => null);
    if (!turnIndicator) return false;
    
    const turnText = await turnIndicator.getText();
    return turnText.includes('Your turn');
  }

  /**
   * Get top card on discard pile
   * @returns {Object} Top card information
   */
  async getTopCard() {
    const topCardElement = await this.config.waitForElement(this.driver, By.id('discard-top'));
    const cardId = await topCardElement.getAttribute('data-card-id');
    const color = await topCardElement.getAttribute('data-color');
    const value = await topCardElement.getAttribute('data-value');
    
    return { id: cardId, color, value };
  }

  /**
   * Get current game color
   * @returns {string} Current color
   */
  async getCurrentColor() {
    const colorIndicator = await this.config.waitForElement(this.driver, By.id('current-color'));
    return await colorIndicator.getAttribute('data-color');
  }

  /**
   * Get all players in the room
   * @returns {Array} Array of player information
   */
  async getPlayers() {
    const playersElement = await this.config.waitForElement(this.driver, By.id('players-list'));
    const playerElements = await playersElement.findElements(By.className('player'));
    
    const players = [];
    for (const playerElement of playerElements) {
      const name = await playerElement.findElement(By.className('player-name')).getText();
      const handCount = await playerElement.findElement(By.className('hand-count')).getText();
      const isActive = await playerElement.getAttribute('data-active') === 'true';
      
      players.push({
        name,
        handCount: parseInt(handCount),
        isActive
      });
    }
    
    return players;
  }

  /**
   * Wait for power card effect to complete
   * @param {string} effectType - Type of power card effect
   */
  async waitForPowerCardEffect(effectType) {
    // Wait for effect animation/notification to complete
    await this.driver.sleep(2000); // Allow time for animation
    
    // Wait for turn update
    await this.config.waitForElement(this.driver, By.id('turn-indicator'));
  }

  /**
   * Check for game error messages
   * @returns {string|null} Error message or null
   */
  async getErrorMessage() {
    const errorElement = await this.driver.findElement(By.id('error-message')).catch(() => null);
    if (!errorElement) return null;
    
    return await errorElement.getText();
  }

  /**
   * Skip turn (for testing power cards)
   */
  async skipTurn() {
    const skipBtn = await this.driver.findElement(By.id('skip-turn-btn')).catch(() => null);
    if (skipBtn) {
      await skipBtn.click();
    }
  }
}

module.exports = UnoGameTestHelper;