/**
 * POWER CARD RULES - 2 PLAYERS (AUTHORITATIVE)
 * 
 * Special considerations for 2-player games:
 * - Reverse acts exactly like Skip
 * - Skip causes same player to play again
 * - Draw cards affect the single opponent
 */

class PowerCardRules2Player {
  constructor() {
    this.playerCount = 2;
    this.rules = {
      skip: {
        description: "Next player (opponent) loses their turn entirely",
        effect: "current_player_plays_again",
        turnAdvancement: "current_keeps_turn"
      },
      reverse: {
        description: "Reverse acts exactly like Skip in 2-player mode",
        effect: "current_player_plays_again",
        turnAdvancement: "current_keeps_turn"
      },
      draw2: {
        description: "Opponent draws 2 cards and loses their turn",
        effect: "opponent_draws_2_loses_turn",
        turnAdvancement: "current_keeps_turn"
      },
      wild: {
        description: "Player chooses color, turn passes to opponent",
        effect: "color_change_only",
        turnAdvancement: "passes_to_opponent"
      },
      wild4: {
        description: "Player chooses color, opponent draws 4 cards and loses turn",
        effect: "opponent_draws_4_loses_turn",
        turnAdvancement: "current_keeps_turn"
      }
    };
  }

  /**
   * Apply Skip card effect in 2-player game
   * @param {Object} gameState - Current game state
   * @returns {Object} New game state
   */
  applySkipCard(gameState) {
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    const opponentIndex = (newGameState.currentPlayerIndex + 1) % 2;
    const opponent = newGameState.players[opponentIndex];
    
    // Skip effect: current player plays again
    newGameState.skipEffect = {
      playerId: opponent.id,
      playerName: opponent.name,
      playersCount: 2,
      currentPlayerPlaysAgain: true
    };
    
    // Current player keeps their turn
    console.log(`${opponent.name} skipped. ${currentPlayer.name} plays again (2-player rule)`);
    
    return newGameState;
  }

  /**
   * Apply Reverse card effect in 2-player game
   * @param {Object} gameState - Current game state
   * @returns {Object} New game state
   */
  applyReverseCard(gameState) {
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    const opponentIndex = (newGameState.currentPlayerIndex + 1) % 2;
    const opponent = newGameState.players[opponentIndex];
    
    // Reverse in 2-player acts exactly like Skip
    newGameState.direction *= -1;
    newGameState.reverseEffect = {
      direction: newGameState.direction > 0 ? 'clockwise' : 'counter-clockwise',
      playersCount: 2,
      actsAsSkip: true
    };
    
    // Current player keeps their turn
    newGameState.skipEffect = {
      playerId: opponent.id,
      playerName: opponent.name,
      reverseIn2Player: true,
      currentPlayerPlaysAgain: true
    };
    
    console.log(`Direction reversed (acts as Skip). ${opponent.name} skipped. ${currentPlayer.name} plays again`);
    
    return newGameState;
  }

  /**
   * Apply Draw Two card effect in 2-player game
   * @param {Object} gameState - Current game state
   * @param {Function} drawCardCallback - Function to draw cards
   * @returns {Object} New game state
   */
  applyDrawTwoCard(gameState, drawCardCallback) {
    const newGameState = { ...gameState };
    const opponentIndex = (newGameState.currentPlayerIndex + 1) % 2;
    const opponent = newGameState.players[opponentIndex];
    
    // Opponent draws 2 cards
    for (let i = 0; i < 2; i++) {
      const card = drawCardCallback(newGameState);
      opponent.hand.push(card);
    }
    opponent.handCount = opponent.hand.length;
    
    // Current player keeps their turn (opponent loses turn)
    newGameState.drawEffect = {
      count: 2,
      playerId: opponent.id,
      playerName: opponent.name,
      canStack: false,
      turnSkipped: true,
      playersCount: 2,
      currentPlayerKeepsTurn: true
    };
    
    console.log(`${opponent.name} draws 2 cards and loses turn. Current player plays again (2-player rule)`);
    
    return newGameState;
  }

  /**
   * Apply Wild Draw Four card effect in 2-player game
   * @param {Object} gameState - Current game state
   * @param {string} chosenColor - Color chosen by current player
   * @param {Function} drawCardCallback - Function to draw cards
   * @returns {Object} New game state
   */
  applyWildDrawFourCard(gameState, chosenColor, drawCardCallback) {
    const newGameState = { ...gameState };
    const opponentIndex = (newGameState.currentPlayerIndex + 1) % 2;
    const opponent = newGameState.players[opponentIndex];
    
    // Opponent draws 4 cards
    for (let i = 0; i < 4; i++) {
      const card = drawCardCallback(newGameState);
      opponent.hand.push(card);
    }
    opponent.handCount = opponent.hand.length;
    
    // Set chosen color
    newGameState.currentColor = chosenColor;
    
    // Current player keeps their turn (opponent loses turn)
    newGameState.wildEffect = {
      count: 4,
      playerId: opponent.id,
      playerName: opponent.name,
      challengeable: true,
      turnSkipped: true,
      playersCount: 2,
      currentPlayerKeepsTurn: true,
      chosenColor: chosenColor
    };
    
    console.log(`${opponent.name} draws 4 cards and loses turn. Color set to ${chosenColor}. Current player plays again (2-player rule)`);
    
    return newGameState;
  }

  /**
   * Get next player index after power card effect
   * @param {Object} gameState - Current game state
   * @param {string} cardType - Type of power card played
   * @returns {number} Next player index
   */
  getNextPlayerIndex(gameState, cardType) {
    const { currentPlayerIndex, direction } = gameState;
    
    switch (cardType) {
      case 'skip':
      case 'reverse':
      case 'draw2':
      case 'wild4':
        // In 2-player mode, these cards result in current player playing again
        return currentPlayerIndex;
        
      case 'wild':
      case 'number':
      default:
        // Normal turn advancement
        return (currentPlayerIndex + direction + 2) % 2;
    }
  }

  /**
   * Validate power card play for 2-player game
   * @param {string} cardType - Type of power card
   * @param {Object} gameState - Current game state
   * @param {Object} player - Player attempting to play
   * @returns {Object} Validation result
   */
  validatePowerCardPlay(cardType, gameState, player) {
    // 2-player specific validations
    const validations = {
      skip: { legal: true, reason: null },
      reverse: { legal: true, reason: null },
      draw2: { legal: true, reason: null },
      wild: { legal: true, reason: null },
      wild4: { legal: true, reason: null } // Challenge system handles illegal plays
    };
    
    return validations[cardType] || { legal: false, reason: 'Unknown power card type' };
  }

  /**
   * Get power card description for 2-player game
   * @param {string} cardType - Type of power card
   * @returns {string} Description
   */
  getPowerCardDescription(cardType) {
    const descriptions = {
      skip: 'Skip: Opponent loses turn, you play again',
      reverse: 'Reverse: Acts like Skip, you play again',
      draw2: 'Draw Two: Opponent draws 2 cards and loses turn',
      wild: 'Wild: Choose color, turn passes to opponent',
      wild4: 'Wild Draw Four: Choose color, opponent draws 4 cards and loses turn'
    };
    
    return descriptions[cardType] || 'Unknown power card';
  }
}

module.exports = PowerCardRules2Player;