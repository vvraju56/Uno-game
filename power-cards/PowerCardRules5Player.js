/**
 * POWER CARD RULES - 5 PLAYERS (AUTHORITATIVE)
 * 
 * Standard UNO rules apply without modifications:
 * - Skip skips the next player only
 * - Reverse changes direction only
 * - Draw cards affect the immediate next player
 */

class PowerCardRules5Player {
  constructor() {
    this.playerCount = 5;
    this.rules = {
      skip: {
        description: "Next player loses their turn entirely",
        effect: "single_player_skip",
        turnAdvancement: "skip_one_player"
      },
      reverse: {
        description: "Direction changes, no player is skipped",
        effect: "direction_change_only",
        turnAdvancement: "normal_to_next_in_new_direction"
      },
      draw2: {
        description: "Next player draws 2 cards and loses their turn",
        effect: "next_player_draws_2_loses_turn",
        turnAdvancement: "skip_to_next_after_target"
      },
      wild: {
        description: "Player chooses color, turn passes to next player",
        effect: "color_change_only",
        turnAdvancement: "passes_to_next_player"
      },
      wild4: {
        description: "Player chooses color, next player draws 4 cards and loses turn",
        effect: "next_player_draws_4_loses_turn",
        turnAdvancement: "skip_to_next_after_target"
      }
    };
  }

  /**
   * Apply Skip card effect in 5-player game
   * @param {Object} gameState - Current game state
   * @returns {Object} New game state
   */
  applySkipCard(gameState) {
    const newGameState = { ...gameState };
    const nextPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + 5) % 5;
    const playerAfterNextIndex = (nextPlayerIndex + newGameState.direction + 5) % 5;
    
    const skippedPlayer = newGameState.players[nextPlayerIndex];
    const nextPlayer = newGameState.players[playerAfterNextIndex];
    
    // Skip effect: next player loses turn
    newGameState.skipEffect = {
      playerId: skippedPlayer.id,
      playerName: skippedPlayer.name,
      playersCount: 5,
      skippedPlayerIndex: nextPlayerIndex,
      nextPlayerIndex: playerAfterNextIndex
    };
    
    // Move to player after skipped one
    newGameState.currentPlayerIndex = playerAfterNextIndex;
    
    console.log(`${skippedPlayer.name} skipped. ${nextPlayer.name} plays next (5-player rule)`);
    
    return newGameState;
  }

  /**
   * Apply Reverse card effect in 5-player game
   * @param {Object} gameState - Current game state
   * @returns {Object} New game state
   */
  applyReverseCard(gameState) {
    const newGameState = { ...gameState };
    const originalDirection = newGameState.direction;
    
    // Reverse direction
    newGameState.direction *= -1;
    
    // Calculate next player in new direction
    const nextPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + 5) % 5;
    const nextPlayer = newGameState.players[nextPlayerIndex];
    
    newGameState.reverseEffect = {
      direction: newGameState.direction > 0 ? 'clockwise' : 'counter-clockwise',
      playersCount: 5,
      originalDirection: originalDirection > 0 ? 'clockwise' : 'counter-clockwise'
    };
    
    // Move to next player in new direction
    newGameState.currentPlayerIndex = nextPlayerIndex;
    
    console.log(`Direction reversed from ${originalDirection > 0 ? 'clockwise' : 'counter-clockwise'} to ${newGameState.direction > 0 ? 'clockwise' : 'counter-clockwise'}. ${nextPlayer.name} plays next (5-player rule)`);
    
    return newGameState;
  }

  /**
   * Apply Draw Two card effect in 5-player game
   * @param {Object} gameState - Current game state
   * @param {Function} drawCardCallback - Function to draw cards
   * @returns {Object} New game state
   */
  applyDrawTwoCard(gameState, drawCardCallback) {
    const newGameState = { ...gameState };
    const targetPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + 5) % 5;
    const playerAfterTargetIndex = (targetPlayerIndex + newGameState.direction + 5) % 5;
    
    const targetPlayer = newGameState.players[targetPlayerIndex];
    const nextPlayer = newGameState.players[playerAfterTargetIndex];
    
    // Target player draws 2 cards
    for (let i = 0; i < 2; i++) {
      const card = drawCardCallback(newGameState);
      targetPlayer.hand.push(card);
    }
    targetPlayer.handCount = targetPlayer.hand.length;
    
    // Move to player after target
    newGameState.currentPlayerIndex = playerAfterTargetIndex;
    
    newGameState.drawEffect = {
      count: 2,
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      canStack: false,
      turnSkipped: true,
      playersCount: 5,
      targetPlayerIndex: targetPlayerIndex,
      nextPlayerIndex: playerAfterTargetIndex
    };
    
    console.log(`${targetPlayer.name} draws 2 cards and loses turn. ${nextPlayer.name} plays next (5-player rule)`);
    
    return newGameState;
  }

  /**
   * Apply Wild Draw Four card effect in 5-player game
   * @param {Object} gameState - Current game state
   * @param {string} chosenColor - Color chosen by current player
   * @param {Function} drawCardCallback - Function to draw cards
   * @returns {Object} New game state
   */
  applyWildDrawFourCard(gameState, chosenColor, drawCardCallback) {
    const newGameState = { ...gameState };
    const targetPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + 5) % 5;
    const playerAfterTargetIndex = (targetPlayerIndex + newGameState.direction + 5) % 5;
    
    const targetPlayer = newGameState.players[targetPlayerIndex];
    const nextPlayer = newGameState.players[playerAfterTargetIndex];
    
    // Target player draws 4 cards
    for (let i = 0; i < 4; i++) {
      const card = drawCardCallback(newGameState);
      targetPlayer.hand.push(card);
    }
    targetPlayer.handCount = targetPlayer.hand.length;
    
    // Set chosen color
    newGameState.currentColor = chosenColor;
    
    // Move to player after target
    newGameState.currentPlayerIndex = playerAfterTargetIndex;
    
    newGameState.wildEffect = {
      count: 4,
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      challengeable: true,
      turnSkipped: true,
      playersCount: 5,
      targetPlayerIndex: targetPlayerIndex,
      nextPlayerIndex: playerAfterTargetIndex,
      chosenColor: chosenColor
    };
    
    console.log(`${targetPlayer.name} draws 4 cards and loses turn. Color set to ${chosenColor}. ${nextPlayer.name} plays next (5-player rule)`);
    
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
        // Skip next player, move to player after them
        const nextPlayerIndex = (currentPlayerIndex + direction + 5) % 5;
        return (nextPlayerIndex + direction + 5) % 5;
        
      case 'reverse':
        // Direction changed, move to next in new direction
        return (currentPlayerIndex + direction + 5) % 5;
        
      case 'draw2':
      case 'wild4':
        // Target loses turn, move to player after target
        const targetIndex = (currentPlayerIndex + direction + 5) % 5;
        return (targetIndex + direction + 5) % 5;
        
      case 'wild':
      case 'number':
      default:
        // Normal turn advancement
        return (currentPlayerIndex + direction + 5) % 5;
    }
  }

  /**
   * Validate power card play for 5-player game
   * @param {string} cardType - Type of power card
   * @param {Object} gameState - Current game state
   * @param {Object} player - Player attempting to play
   * @returns {Object} Validation result
   */
  validatePowerCardPlay(cardType, gameState, player) {
    // 5-player standard validations
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
   * Get power card description for 5-player game
   * @param {string} cardType - Type of power card
   * @returns {string} Description
   */
  getPowerCardDescription(cardType) {
    const descriptions = {
      skip: 'Skip: Next player loses turn, player after them plays',
      reverse: 'Reverse: Direction changes, next player in new direction plays',
      draw2: 'Draw Two: Next player draws 2 cards and loses turn',
      wild: 'Wild: Choose color, next player in turn order plays',
      wild4: 'Wild Draw Four: Choose color, next player draws 4 cards and loses turn'
    };
    
    return descriptions[cardType] || 'Unknown power card';
  }

  /**
   * Get player position in 5-player game
   * @param {number} playerIndex - Player index
   * @param {number} currentPlayerIndex - Current player index
   * @param {number} direction - Direction of play
   * @returns {string} Position description
   */
  getPlayerPosition(playerIndex, currentPlayerIndex, direction) {
    const relativeIndex = (playerIndex - currentPlayerIndex + 5 + 5 * 5) % 5; // Normalize to 0-4
    
    switch (relativeIndex) {
      case 0: return 'current';
      case 1: return direction > 0 ? 'next' : 'previous';
      case 2: return direction > 0 ? 'second_next' : 'second_previous';
      case 3: return direction > 0 ? 'second_previous' : 'second_next';
      case 4: return direction > 0 ? 'previous' : 'next';
      default: return 'unknown';
    }
  }
}

module.exports = PowerCardRules5Player;