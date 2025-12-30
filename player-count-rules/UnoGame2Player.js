/**
 * UNO GAME - 2 PLAYERS COMPLETE IMPLEMENTATION
 * 
 * Special 2-player rules:
 * - Skip: Current player plays again (opponent loses turn)
 * - Reverse: Acts exactly like Skip (current player plays again)  
 * - Draw Two: Opponent draws 2 cards and loses turn
 * - Wild Draw Four: Opponent draws 4 cards and loses turn
 */

class UnoGame2Player {
  constructor() {
    this.playerCount = 2;
    this.colors = ['red', 'blue', 'green', 'yellow'];
    this.validWildColors = ['red', 'blue', 'green', 'yellow'];
    this.numberValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    this.actionValues = ['skip', 'reverse', 'draw2'];
    this.values = [...this.numberValues, ...this.actionValues];
    this.wildCards = ['wild', 'wild4'];
  }

  /**
   * Create deck for 2-player game
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
   * Create game room for 2 players
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
      playerCount: 2,
      powerCardEffects: {
        skip: 'current_keeps_turn',
        reverse: 'acts_as_skip',
        draw2: 'opponent_draws_2_loses_turn',
        wild4: 'opponent_draws_4_loses_turn'
      }
    };
  }

  /**
   * Add player to room
   */
  addPlayer(room, player) {
    if (room.players.length >= 2) {
      throw new Error('Room is full (max 2 players)');
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
   * Start game with 2 players
   */
  startGame(room) {
    if (room.players.length !== 2) {
      throw new Error('Need exactly 2 players to start 2-player game');
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
      // Skip: current player (0) plays again
      room.skipEffect = {
        playerId: room.players[1].id,
        playerName: room.players[1].name,
        currentPlayerKeepsTurn: true,
        reason: '2-player special rule: Skip acts as keep turn'
      };
    } else if (firstCard.value === 'reverse') {
      // Reverse: acts exactly like Skip in 2-player
      room.direction *= -1;
      room.reverseEffect = {
        direction: room.direction > 0 ? 'clockwise' : 'counter-clockwise',
        playersCount: 2,
        actsAsSkip: true
      };
      room.skipEffect = {
        playerId: room.players[1].id,
        playerName: room.players[1].name,
        reverseIn2Player: true,
        currentPlayerKeepsTurn: true
      };
    } else if (firstCard.value === 'draw2') {
      // Draw Two: player 1 draws 2 cards and loses turn, player 0 keeps turn
      this.makePlayerDrawCards(room, room.players[1].id, 2);
      room.drawEffect = { 
        count: 2, 
        playerId: room.players[1].id, 
        playerName: room.players[1].name,
        currentPlayerKeepsTurn: true,
        reason: '2-player special rule: target loses turn'
      };
    } else if (firstCard.value === 'wild') {
      // Wild: set random color, normal turn progression
      room.currentColor = room.colors[Math.floor(Math.random() * room.colors.length)];
      // Player 1 gets first turn
      room.currentPlayerIndex = 1;
    }
  }

  /**
   * Play card in 2-player game
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
    
    // Apply 2-player specific power card effects
    let nextPlayerIndex = room.currentPlayerIndex;
    const opponentIndex = (room.currentPlayerIndex + 1) % 2;
    const opponent = room.players[opponentIndex];
    
    switch (card.value) {
      case 'skip':
        // Skip: current player plays again
        room.skipEffect = {
          playerId: opponent.id,
          playerName: opponent.name,
          currentPlayerKeepsTurn: true,
          playersCount: 2,
          reason: '2-player rule: Skip acts as keep turn'
        };
        // currentPlayerIndex stays the same
        nextPlayerIndex = room.currentPlayerIndex;
        console.log(`${opponent.name} skipped. ${player.name} plays again (2-player Skip rule)`);
        break;
        
      case 'reverse':
        // Reverse: acts exactly like Skip in 2-player
        room.direction *= -1;
        room.reverseEffect = {
          direction: room.direction > 0 ? 'clockwise' : 'counter-clockwise',
          playersCount: 2,
          actsAsSkip: true
        };
        room.skipEffect = {
          playerId: opponent.id,
          playerName: opponent.name,
          reverseIn2Player: true,
          currentPlayerKeepsTurn: true
        };
        // currentPlayerIndex stays the same
        nextPlayerIndex = room.currentPlayerIndex;
        console.log(`Direction reversed (acts as Skip). ${opponent.name} skipped. ${player.name} plays again (2-player Reverse rule)`);
        break;
        
      case 'draw2':
        // Draw Two: opponent draws 2 cards and loses turn
        this.makePlayerDrawCards(room, opponent.id, 2);
        room.drawEffect = {
          count: 2,
          playerId: opponent.id,
          playerName: opponent.name,
          currentPlayerKeepsTurn: true,
          playersCount: 2,
          reason: '2-player rule: opponent draws and loses turn'
        };
        // currentPlayerIndex stays the same
        nextPlayerIndex = room.currentPlayerIndex;
        console.log(`${opponent.name} draws 2 cards and loses turn. ${player.name} plays again (2-player Draw Two rule)`);
        break;
        
      case 'wild4':
        // Wild Draw Four: player chooses color, opponent draws 4 cards and loses turn
        this.makePlayerDrawCards(room, opponent.id, 4);
        room.wildEffect = {
          count: 4,
          playerId: opponent.id,
          playerName: opponent.name,
          currentPlayerKeepsTurn: true,
          playersCount: 2,
          chosenColor: chosenColor,
          reason: '2-player rule: opponent draws and loses turn'
        };
        // currentPlayerIndex stays the same
        nextPlayerIndex = room.currentPlayerIndex;
        console.log(`${opponent.name} draws 4 cards and loses turn. Color set to ${chosenColor}. ${player.name} plays again (2-player Wild Draw Four rule)`);
        break;
        
      case 'wild':
        // Wild: normal turn progression in 2-player
        room.wildEffect = {
          colorChosen: true,
          playersCount: 2,
          chosenColor: chosenColor
        };
        nextPlayerIndex = opponentIndex;
        console.log(`Color changed to ${chosenColor}. ${opponent.name} plays next (2-player Wild rule)`);
        break;
        
      default:
        // Number card: normal turn progression
        nextPlayerIndex = opponentIndex;
        console.log(`${player.name} played ${card.color} ${card.value}. ${opponent.name} plays next (2-player normal rule)`);
    }
    
    room.currentPlayerIndex = nextPlayerIndex;
    
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
      playerCount: 2,
      skipEffect: room.skipEffect || null,
      reverseEffect: room.reverseEffect || false,
      drawEffect: room.drawEffect || null,
      wildEffect: room.wildEffect || null,
      scores: room.scores,
      roundWinner: room.roundWinner,
      gameWinner: room.gameWinner,
      twoPlayerRules: true
    };
  }

  /**
   * Get next player index (2-player specific)
   */
  getNextPlayerIndex(room) {
    return (room.currentPlayerIndex + room.direction + 2) % 2;
  }

  /**
   * Get 2-player rule description
   */
  getPlayerCountRules() {
    return {
      playerCount: 2,
      description: '2-Player UNO Rules (Special Mode)',
      rules: {
        skip: 'Current player plays again (opponent loses turn)',
        reverse: 'Acts exactly like Skip (current player plays again)',
        draw2: 'Opponent draws 2 cards and loses turn',
        wild4: 'Opponent draws 4 cards and loses turn',
        wild: 'Normal turn progression after color choice'
      },
      specialBehaviors: [
        'Skip and Reverse cards give current player another turn',
        'Draw cards always affect the single opponent',
        'Game is more strategic with direct opponent targeting'
      ]
    };
  }
}

module.exports = UnoGame2Player;