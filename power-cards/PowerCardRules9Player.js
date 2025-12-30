/**
 * POWER CARD RULES - 9 PLAYERS (AUTHORITATIVE)
 * 
 * Standard UNO rules apply without modifications:
 * - Skip skips the next player only
 * - Reverse changes direction only
 * - Draw cards affect the immediate next player
 */

class PowerCardRules9Player {
  constructor() {
    this.playerCount = 9;
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

  applySkipCard(gameState) {
    const newGameState = { ...gameState };
    const nextPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + 9) % 9;
    const playerAfterNextIndex = (nextPlayerIndex + newGameState.direction + 9) % 9;
    
    const skippedPlayer = newGameState.players[nextPlayerIndex];
    const nextPlayer = newGameState.players[playerAfterNextIndex];
    
    newGameState.skipEffect = {
      playerId: skippedPlayer.id,
      playerName: skippedPlayer.name,
      playersCount: 9,
      skippedPlayerIndex: nextPlayerIndex,
      nextPlayerIndex: playerAfterNextIndex
    };
    
    newGameState.currentPlayerIndex = playerAfterNextIndex;
    console.log(`${skippedPlayer.name} skipped. ${nextPlayer.name} plays next (9-player rule)`);
    
    return newGameState;
  }

  applyReverseCard(gameState) {
    const newGameState = { ...gameState };
    const originalDirection = newGameState.direction;
    
    newGameState.direction *= -1;
    const nextPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + 9) % 9;
    const nextPlayer = newGameState.players[nextPlayerIndex];
    
    newGameState.reverseEffect = {
      direction: newGameState.direction > 0 ? 'clockwise' : 'counter-clockwise',
      playersCount: 9,
      originalDirection: originalDirection > 0 ? 'clockwise' : 'counter-clockwise'
    };
    
    newGameState.currentPlayerIndex = nextPlayerIndex;
    console.log(`Direction reversed from ${originalDirection > 0 ? 'clockwise' : 'counter-clockwise'} to ${newGameState.direction > 0 ? 'clockwise' : 'counter-clockwise'}. ${nextPlayer.name} plays next (9-player rule)`);
    
    return newGameState;
  }

  applyDrawTwoCard(gameState, drawCardCallback) {
    const newGameState = { ...gameState };
    const targetPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + 9) % 9;
    const playerAfterTargetIndex = (targetPlayerIndex + newGameState.direction + 9) % 9;
    
    const targetPlayer = newGameState.players[targetPlayerIndex];
    const nextPlayer = newGameState.players[playerAfterTargetIndex];
    
    for (let i = 0; i < 2; i++) {
      const card = drawCardCallback(newGameState);
      targetPlayer.hand.push(card);
    }
    targetPlayer.handCount = targetPlayer.hand.length;
    
    newGameState.currentPlayerIndex = playerAfterTargetIndex;
    
    newGameState.drawEffect = {
      count: 2,
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      canStack: false,
      turnSkipped: true,
      playersCount: 9,
      targetPlayerIndex: targetPlayerIndex,
      nextPlayerIndex: playerAfterTargetIndex
    };
    
    console.log(`${targetPlayer.name} draws 2 cards and loses turn. ${nextPlayer.name} plays next (9-player rule)`);
    
    return newGameState;
  }

  applyWildDrawFourCard(gameState, chosenColor, drawCardCallback) {
    const newGameState = { ...gameState };
    const targetPlayerIndex = (newGameState.currentPlayerIndex + newGameState.direction + 9) % 9;
    const playerAfterTargetIndex = (targetPlayerIndex + newGameState.direction + 9) % 9;
    
    const targetPlayer = newGameState.players[targetPlayerIndex];
    const nextPlayer = newGameState.players[playerAfterTargetIndex];
    
    for (let i = 0; i < 4; i++) {
      const card = drawCardCallback(newGameState);
      targetPlayer.hand.push(card);
    }
    targetPlayer.handCount = targetPlayer.hand.length;
    
    newGameState.currentColor = chosenColor;
    newGameState.currentPlayerIndex = playerAfterTargetIndex;
    
    newGameState.wildEffect = {
      count: 4,
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      challengeable: true,
      turnSkipped: true,
      playersCount: 9,
      targetPlayerIndex: targetPlayerIndex,
      nextPlayerIndex: playerAfterTargetIndex,
      chosenColor: chosenColor
    };
    
    console.log(`${targetPlayer.name} draws 4 cards and loses turn. Color set to ${chosenColor}. ${nextPlayer.name} plays next (9-player rule)`);
    
    return newGameState;
  }

  getNextPlayerIndex(gameState, cardType) {
    const { currentPlayerIndex, direction } = gameState;
    
    switch (cardType) {
      case 'skip':
        const nextPlayerIndex = (currentPlayerIndex + direction + 9) % 9;
        return (nextPlayerIndex + direction + 9) % 9;
        
      case 'reverse':
        return (currentPlayerIndex + direction + 9) % 9;
        
      case 'draw2':
      case 'wild4':
        const targetIndex = (currentPlayerIndex + direction + 9) % 9;
        return (targetIndex + direction + 9) % 9;
        
      case 'wild':
      case 'number':
      default:
        return (currentPlayerIndex + direction + 9) % 9;
    }
  }

  validatePowerCardPlay(cardType, gameState, player) {
    const validations = {
      skip: { legal: true, reason: null },
      reverse: { legal: true, reason: null },
      draw2: { legal: true, reason: null },
      wild: { legal: true, reason: null },
      wild4: { legal: true, reason: null }
    };
    
    return validations[cardType] || { legal: false, reason: 'Unknown power card type' };
  }

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

  getPlayerPosition(playerIndex, currentPlayerIndex, direction) {
    const relativeIndex = (playerIndex - currentPlayerIndex + 9 + 9 * 9) % 9;
    
    if (relativeIndex === 0) return 'current';
    if (relativeIndex === 1) return direction > 0 ? 'next' : 'previous';
    if (relativeIndex === 5) return direction > 0 ? 'previous' : 'next';
    if (relativeIndex === 3) return 'opposite';
    
    return `position_${relativeIndex}`;
  }
}

module.exports = PowerCardRules9Player;