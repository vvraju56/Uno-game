/**
 * UNO GAME - 6 PLAYERS COMPLETE IMPLEMENTATION
 * 
 * Standard 6-player rules:
 * - Skip: Next player loses turn entirely, player after them plays
 * - Reverse: Direction changes only, next player in new direction plays
 * - Draw Two: Next player draws 2 cards and loses turn
 * - Wild Draw Four: Next player draws 4 cards and loses turn
 */

class UnoGame6Player {
  constructor() {
    this.playerCount = 6;
    this.colors = ['red', 'blue', 'green', 'yellow'];
    this.validWildColors = ['red', 'blue', 'green', 'yellow'];
    this.numberValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    this.actionValues = ['skip', 'reverse', 'draw2'];
    this.values = [...this.numberValues, ...this.actionValues];
    this.wildCards = ['wild', 'wild4'];
  }

  /**
   * Create deck for 6-player game
   */
  createDeck() {
    const deck = [];
    
    // Number cards
    for (const color of this.colors) {
      deck.push({ id: `${color}_0`, color, value: '0' });
      
      for (const value of this.numberValues.slice(1)) {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      }
    }
    
    // Action cards (2 of each color)
    for (const color of this.colors) {
      for (const value of this.actionValues) {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      }
    }
    
    // Wild cards (4 of each)
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `wild_${i}`, color: 'wild', value: 'wild' });
      deck.push({ id: `wild4_${i}`, color: 'wild', value: 'wild4' });
    }
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  /**
   * Create game room for 6 players
   */
  createRoom(roomId) {
    const deck = this.createDeck();
    const discardPile = [];
    
    // Find first card that's not Wild Draw Four
    let firstCard;
    do {
      firstCard = deck.pop();
      if (firstCard.value === 'wild4') {
        deck.unshift(firstCard);
        continue;
      }
      break;
    } while (true);
    
    discardPile.push(firstCard);

    return {
      roomId,
      players: [],
      deck,
      discardPile,
      currentPlayerIndex: 0,
      direction: 1, // clockwise initially
      currentColor: firstCard.color === 'wild' ? null : firstCard.color,
      gameStarted: false,
      unoCallRequired: false,
      lastPlayerToCallUno: null,
      scores: {},
      playerCount: 6,
      powerCardEffects: {
        skip: 'next_player_loses_turn',
        reverse: 'direction_change_only',
        draw2: 'next_player_draws_2_loses_turn',
        wild4: 'next_player_draws_4_loses_turn'
      }
    };
  }

  /**
   * Add player to room
   */
  addPlayer(room, player) {
    if (room.players.length >= 6) {
      throw new Error('Room is full (max 6 players)');
    }
    
    room.players.push({
      id: player.id,
      name: player.name,
      hand: [],
      handCount: 0,
      connected: true
    });
  }

  /**
   * Start game with 6 players
   */
  startGame(room) {
    if (room.players.length !== 6) {
      throw new Error('Need exactly 6 players to start 6-player game');
    }
    
    // Deal 7 cards to each player
    for (const player of room.players) {
      player.hand = [];
      for (let i = 0; i < 7; i++) {
        player.hand.push(room.deck.pop());
      }
      player.handCount = player.hand.length;
      if (!room.scores[player.id]) {
        room.scores[player.id] = 0;
      }
    }
    
    room.gameStarted = true;
    room.currentPlayerIndex = 0;
    
    // Apply first card effect (if it's an action card)
    const firstCard = room.discardPile[0];
    if (firstCard.value === 'skip') {
      room.currentPlayerIndex = this.getNextPlayerIndex(room);
      room.skipEffect = {
        playerId: room.players[1].id,
        playerName: room.players[1].name,
        nextPlayerIndex: 2,
        reason: '6-player rule: skip next player'
      };
    } else if (firstCard.value === 'reverse') {
      room.direction *= -1;
      room.currentPlayerIndex = 5; // Last player in counter-clockwise
      room.reverseEffect = {
        direction: room.direction > 0 ? 'clockwise' : 'counter-clockwise',
        playersCount: 6,
        reason: '6-player rule: direction change only'
      };
    } else if (firstCard.value === 'draw2') {
      this.makePlayerDrawCards(room, room.players[1].id, 2);
      room.currentPlayerIndex = 2;
      room.drawEffect = { 
        count: 2, 
        playerId: room.players[1].id, 
        playerName: room.players[1].name,
        nextPlayerIndex: 2,
        reason: '6-player rule: target draws and loses turn'
      };
    } else if (firstCard.value === 'wild') {
      room.currentColor = room.colors[Math.floor(Math.random() * room.colors.length)];
      room.currentPlayerIndex = 1;
    }
  }

  /**
   * Play card in 6-player game
   */
  playCard(room, playerId, cardId, chosenColor = null) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    
    if (room.currentPlayerIndex !== room.players.findIndex(p => p.id === playerId)) {
      throw new Error('Not your turn');
    }
    
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not in hand');
    
    const card = player.hand[cardIndex];
    const topCard = room.discardPile[room.discardPile.length - 1];
    
    if (!this.canPlayCard(card, topCard, room.currentColor)) {
      throw new Error('Cannot play this card');
    }
    
    // Remove card from hand and add to discard pile
    player.hand.splice(cardIndex, 1);
    player.handCount = player.hand.length;
    room.discardPile.push(card);
    
    // Set color
    if (card.color === 'wild') {
      if (this.validWildColors.includes(chosenColor)) {
        room.currentColor = chosenColor;
      } else {
        room.currentColor = chosenColor || 'red';
      }
    } else {
      room.currentColor = card.color;
    }
    
    // Clear previous effects
    this.clearPowerCardEffects(room);
    
    // Apply 6-player specific power card effects
    const nextPlayerIndex = this.getNextPlayerIndex(room);
    let finalNextPlayerIndex = nextPlayerIndex;
    
    switch (card.value) {
      case 'skip':
        // Skip: next player loses turn, player after them plays
        const skippedPlayerIndex = nextPlayerIndex;
        const playerAfterSkippedIndex = this.getNextPlayerIndexFrom(room, skippedPlayerIndex);
        const skippedPlayer = room.players[skippedPlayerIndex];
        const playerAfterSkipped = room.players[playerAfterSkippedIndex];
        
        room.skipEffect = {
          playerId: skippedPlayer.id,
          playerName: skippedPlayer.name,
          playersCount: 6,
          skippedPlayerIndex: skippedPlayerIndex,
          nextPlayerIndex: playerAfterSkippedIndex,
          reason: '6-player rule: next player loses turn'
        };
        
        finalNextPlayerIndex = playerAfterSkippedIndex;
        console.log(`${skippedPlayer.name} skipped. ${playerAfterSkipped.name} plays next (6-player Skip rule)`);
        break;
        
      case 'reverse':
        // Reverse: direction changes only, next player in new direction plays
        const originalDirection = room.direction;
        room.direction *= -1;
        const nextInNewDirection = this.getNextPlayerIndex(room);
        const nextPlayer = room.players[nextInNewDirection];
        
        room.reverseEffect = {
          direction: room.direction > 0 ? 'clockwise' : 'counter-clockwise',
          playersCount: 6,
          originalDirection: originalDirection > 0 ? 'clockwise' : 'counter-clockwise',
          reason: '6-player rule: direction change only'
        };
        
        finalNextPlayerIndex = nextInNewDirection;
        console.log(`Direction reversed from ${originalDirection > 0 ? 'clockwise' : 'counter-clockwise'} to ${room.direction > 0 ? 'clockwise' : 'counter-clockwise'}. ${nextPlayer.name} plays next (6-player Reverse rule)`);
        break;
        
      case 'draw2':
        // Draw Two: next player draws 2 cards and loses turn
        const targetPlayerIndex = nextPlayerIndex;
        const playerAfterTargetIndex = this.getNextPlayerIndexFrom(room, targetPlayerIndex);
        const targetPlayer = room.players[targetPlayerIndex];
        const playerAfterTarget = room.players[playerAfterTargetIndex];
        
        this.makePlayerDrawCards(room, targetPlayer.id, 2);
        
        room.drawEffect = {
          count: 2,
          playerId: targetPlayer.id,
          playerName: targetPlayer.name,
          playersCount: 6,
          targetPlayerIndex: targetPlayerIndex,
          nextPlayerIndex: playerAfterTargetIndex,
          reason: '6-player rule: target draws and loses turn'
        };
        
        finalNextPlayerIndex = playerAfterTargetIndex;
        console.log(`${targetPlayer.name} draws 2 cards and loses turn. ${playerAfterTarget.name} plays next (6-player Draw Two rule)`);
        break;
        
      case 'wild4':
        // Wild Draw Four: player chooses color, next player draws 4 cards and loses turn
        const wild4TargetIndex = nextPlayerIndex;
        const playerAfterWild4Index = this.getNextPlayerIndexFrom(room, wild4TargetIndex);
        const wild4Target = room.players[wild4TargetIndex];
        const playerAfterWild4 = room.players[playerAfterWild4Index];
        
        this.makePlayerDrawCards(room, wild4Target.id, 4);
        
        room.wildEffect = {
          count: 4,
          playerId: wild4Target.id,
          playerName: wild4Target.name,
          playersCount: 6,
          targetPlayerIndex: wild4TargetIndex,
          nextPlayerIndex: playerAfterWild4Index,
          chosenColor: chosenColor,
          reason: '6-player rule: target draws and loses turn'
        };
        
        finalNextPlayerIndex = playerAfterWild4Index;
        console.log(`${wild4Target.name} draws 4 cards and loses turn. Color set to ${chosenColor}. ${playerAfterWild4.name} plays next (6-player Wild Draw Four rule)`);
        break;
        
      case 'wild':
        // Wild: normal turn progression in 6-player
        room.wildEffect = {
          colorChosen: true,
          playersCount: 6,
          chosenColor: chosenColor
        };
        const nextAfterWild = room.players[nextPlayerIndex];
        console.log(`Color changed to ${chosenColor}. ${nextAfterWild.name} plays next (6-player Wild rule)`);
        break;
        
      default:
        // Number card: normal turn progression
        const nextAfterNumber = room.players[nextPlayerIndex];
        console.log(`${player.name} played ${card.color} ${card.value}. ${nextAfterNumber.name} plays next (6-player normal rule)`);
    }
    
    room.currentPlayerIndex = finalNextPlayerIndex;
    
    // Check for winner
    const winner = player.hand.length === 0 ? player : null;
    if (winner) {
      this.handleWin(room, winner);
    }
    
    return {
      playedCard: card,
      chosenColor,
      nextPlayerIndex: room.currentPlayerIndex,
      winner,
      gameState: this.getGameState(room)
    };
  }

  /**
   * Make player draw cards
   */
  makePlayerDrawCards(room, playerId, count) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    
    for (let i = 0; i < count; i++) {
      if (room.deck.length === 0) {
        this.reshuffleDeck(room);
      }
      if (room.deck.length > 0) {
        const card = room.deck.pop();
        player.hand.push(card);
      }
    }
    
    player.handCount = player.hand.length;
  }

  /**
   * Reshuffle deck from discard pile
   */
  reshuffleDeck(room) {
    if (room.discardPile.length <= 1) {
      throw new Error('No cards to reshuffle');
    }
    
    const topCard = room.discardPile.pop();
    room.deck = [...room.discardPile];
    
    // Shuffle new deck
    for (let j = room.deck.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [room.deck[j], room.deck[k]] = [room.deck[k], room.deck[j]];
    }
    
    room.discardPile = [topCard];
  }

  /**
   * Check if card can be played
   */
  canPlayCard(card, topCard, currentColor) {
    if (!topCard || !currentColor) return false;
    
    return card.color === currentColor ||
           card.value === topCard.value ||
           card.color === 'wild';
  }

  /**
   * Clear power card effects
   */
  clearPowerCardEffects(room) {
    room.skipEffect = null;
    room.reverseEffect = false;
    room.drawEffect = null;
    room.wildEffect = null;
  }

  /**
   * Get next player index from specific player
   */
  getNextPlayerIndexFrom(room, fromPlayerIndex) {
    return (fromPlayerIndex + room.direction + 6) % 6;
  }

  /**
   * Get next player index
   */
  getNextPlayerIndex(room) {
    return (room.currentPlayerIndex + room.direction + 6) % 6;
  }

  /**
   * Handle game win
   */
  handleWin(room, winner) {
    let roundScore = 0;
    for (const p of room.players) {
      if (p.id !== winner.id) {
        for (const c of p.hand) {
          roundScore += this.getCardPoints(c);
        }
      }
    }
    room.scores[winner.id] = (room.scores[winner.id] || 0) + roundScore;
    room.roundWinner = { player: winner, score: roundScore };
    
    const gameWinner = Object.entries(room.scores).find(([id, score]) => score >= 500);
    if (gameWinner) {
      room.gameWinner = room.players.find(p => p.id === gameWinner[0]);
    }
  }

  /**
   * Get card points
   */
  getCardPoints(card) {
    if (this.numberValues.includes(card.value)) {
      return parseInt(card.value);
    }
    if (this.actionValues.includes(card.value)) {
      return 20;
    }
    if (card.value === 'wild' || card.value === 'wild4') {
      return 50;
    }
    return 0;
  }

  /**
   * Get game state
   */
  getGameState(room) {
    return {
      roomId: room.roomId,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        handCount: p.handCount || (p.hand ? p.hand.length : 0),
        connected: p.connected,
        score: room.scores[p.id] || 0
      })),
      discardTop: room.discardPile[room.discardPile.length - 1],
      deckCount: room.deck.length,
      currentPlayerIndex: room.currentPlayerIndex,
      direction: room.direction,
      currentColor: room.currentColor,
      gameStarted: room.gameStarted,
      playerCount: 6,
      skipEffect: room.skipEffect || null,
      reverseEffect: room.reverseEffect || false,
      drawEffect: room.drawEffect || null,
      wildEffect: room.wildEffect || null,
      scores: room.scores,
      roundWinner: room.roundWinner,
      gameWinner: room.gameWinner,
      6PlayerRules: true
    };
  }

  /**
   * Get 6-player rule description
   */
  getPlayerCountRules() {
    return {
      playerCount: 6,
      description: '6-Player UNO Rules (Standard)',
      rules: {
        skip: 'Next player loses turn, player after them plays',
        reverse: 'Direction changes only, next player in new direction plays',
        draw2: 'Next player draws 2 cards and loses turn',
        wild4: 'Next player draws 4 cards and loses turn',
        wild: 'Normal turn progression after color choice'
      },
      specialBehaviors: [
        'Skip affects only immediate next player',
        'Reverse only changes direction of play',
        'Turn order wraps around 6 players',
        'Strategic positioning becomes important with 6 players'
      ]
    };
  }
}

module.exports = UnoGame6Player;
