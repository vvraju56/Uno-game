class UnoGame {
  constructor() {
    this.colors = ['red', 'blue', 'green', 'yellow'];
    this.validWildColors = ['red', 'blue', 'green', 'yellow']; // Standard UNO colors only
    this.numberValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    this.actionValues = ['skip', 'reverse', 'draw2'];
    this.values = [...this.numberValues, ...this.actionValues];
    this.wildCards = ['wild', 'wild4'];
  }

  createDeck() {
    const deck = [];
    
    // Add colored cards (total 76 cards)
    for (const color of this.colors) {
      // One 0 per color (4 cards total)
      deck.push({ id: `${color}_0`, color, value: '0' });
      
      // Two of each 1-9 per color (72 cards total)
      for (const value of this.numberValues.slice(1)) {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      }
      
      // Two of each action card per color (24 cards total)
      for (const value of this.actionValues) {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      }
    }
    
    // Add wild cards (8 cards total)
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `wild_${i}`, color: 'wild', value: 'wild' });
      deck.push({ id: `wild4_${i}`, color: 'wild', value: 'wild4' });
    }
    
    // Verify deck size (should be 108 cards)
    if (deck.length !== 108) {
      throw new Error(`Deck has ${deck.length} cards, should have 108`);
    }
    
    // Shuffle deck thoroughly
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  createDeck() {
    const deck = [];
    
    // Add colored cards (total 100 cards)
    for (const color of this.colors) {
      // One 0 per color (4 cards total)
      deck.push({ id: `${color}_0`, color, value: '0' });
      
      // Two of each 1-9 per color (72 cards total)
      for (const value of this.numberValues.slice(1)) {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      }
      
      // Two of each action card per color (24 cards total)
      for (const value of this.actionValues) {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      }
    }
    
    // Add wild cards (8 cards total)
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `wild_${i}`, color: 'wild', value: 'wild' });
      deck.push({ id: `wild4_${i}`, color: 'wild', value: 'wild4' });
    }
    
    // Verify deck size (should be 108 cards)
    if (deck.length !== 108) {
      throw new Error(`Deck has ${deck.length} cards, should have 108`);
    }
    
    // Shuffle deck thoroughly
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Add wild cards
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `wild_${i}`, color: 'wild', value: 'wild' });
      deck.push({ id: `wild4_${i}`, color: 'wild', value: 'wild4' });
    }
    
    // Shuffle deck thoroughly
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  createRoom(roomId) {
    const deck = this.createDeck();
    const discardPile = [];
    
    // Draw first card (not wild)
    let firstCard;
    do {
      firstCard = deck.pop();
    } while (firstCard.color === 'wild');
    discardPile.push(firstCard);

    return {
      roomId,
      players: [],
      deck,
      discardPile,
      currentPlayerIndex: 0,
      direction: 1,
      currentColor: firstCard.color,
      gameStarted: false,
      unoCallRequired: false,
      lastPlayerToCallUno: null
    };
  }

  addPlayer(room, player) {
    if (room.players.length >= 12) {
      throw new Error('Room is full (max 12 players)');
    }
    
    room.players.push({
      id: player.id,
      name: player.name,
      hand: [],
      handCount: 0,
      connected: true
    });
  }

  removePlayer(room, playerId) {
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      
      // Adjust current player index if necessary
      if (room.currentPlayerIndex >= room.players.length) {
        room.currentPlayerIndex = 0;
      }
    }
  }

  startGame(room) {
    if (room.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }
    
    // Deal 7 cards to each player
    for (const player of room.players) {
      player.hand = [];
      for (let i = 0; i < 7; i++) {
        player.hand.push(room.deck.pop());
      }
      player.handCount = player.hand.length;
    }
    
    room.gameStarted = true;
    room.currentPlayerIndex = Math.floor(Math.random() * room.players.length);
  }

  canPlayCard(card, topCard, currentColor) {
    if (!topCard || !currentColor) return false;
    
    return card.color === currentColor ||
           card.value === topCard.value ||
           card.color === 'wild';
  }

  drawCard(room) {
    if (room.deck.length === 0) {
      this.reshuffleDeck(room);
    }
    return room.deck.pop();
  }

  reshuffleDeck(room) {
    if (room.discardPile.length <= 1) {
      throw new Error('No cards to reshuffle');
    }
    
    const topCard = room.discardPile.pop();
    room.deck = [...room.discardPile];
    
    // Shuffle new deck thoroughly
    for (let j = room.deck.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [room.deck[j], room.deck[k]] = [room.deck[k], room.deck[j]];
    }
    
    room.discardPile = [topCard];
    console.log(`Reshuffled ${room.deck.length} cards from discard pile`);
  }

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
      console.log(`Cannot play card ${card.color} ${card.value} on ${topCard.color} ${topCard.value} (current: ${room.currentColor})`);
      throw new Error('Cannot play this card');
    }
    
    // Check UNO call requirement
    if (player.hand.length === 2 && room.unoCallRequired && room.lastPlayerToCallUno !== playerId) {
      throw new Error('Must call UNO when you have one card left');
    }
    
    // Remove card from hand and add to discard
    player.hand.splice(cardIndex, 1);
    player.handCount = player.hand.length;
    room.discardPile.push(card);
    
    // Handle wild cards - only allow standard UNO colors
    if (card.color === 'wild') {
      if (this.validWildColors.includes(chosenColor)) {
        room.currentColor = chosenColor;
      } else {
        room.currentColor = chosenColor || 'red'; // Default to red if invalid
      }
    } else {
      room.currentColor = card.color;
    }
    
    // Reset UNO call requirement
    room.unoCallRequired = false;
    room.lastPlayerToCallUno = null;
    
    // Handle card effects
    let nextPlayerIndex = this.getNextPlayerIndex(room);
    
    // Apply power card effects according to official UNO rules
    switch (card.value) {
      case 'skip':
        // Skip: Next player loses their turn entirely
        const skippedPlayer = room.players[nextPlayerIndex];
        console.log(`${skippedPlayer.name} skipped (${room.players.length} players)`);
        
        // Skip over the next player to the player after them
        room.currentPlayerIndex = this.getNextPlayerIndex(room);
        
        // Apply skip effect for animation
        room.skipEffect = { playerId: skippedPlayer.id, playerName: skippedPlayer.name };
        break;
        
      case 'reverse':
        // Reverse: Change direction of play
        room.direction *= -1;
        console.log(`Direction reversed to ${room.direction > 0 ? 'clockwise' : 'counter-clockwise'} (${room.players.length} players)`);
        
        if (room.players.length === 2) {
          // With 2 players, reverse acts exactly like skip
          const skippedPlayer = room.players[nextPlayerIndex];
          room.currentPlayerIndex = this.getNextPlayerIndex(room);
          room.skipEffect = { playerId: skippedPlayer.id, playerName: skippedPlayer.name };
        } else {
          // With 3+ players, just change direction and pass turn normally
          room.currentPlayerIndex = nextPlayerIndex;
        }
        
        // Apply reverse effect for animation
        room.reverseEffect = true;
        break;
        
      case 'draw2':
        // Draw Two: Next player draws 2 cards and loses their turn
        const draw2Target = room.players[nextPlayerIndex];
        console.log(`${draw2Target.name} draws 2 cards (${room.players.length} players)`);
        
        this.makePlayerDrawCards(room, draw2Target.id, 2);
        
        // Skip the player who drew cards
        room.currentPlayerIndex = this.getNextPlayerIndex(room);
        
        // Apply draw effect for animation
        room.drawEffect = { count: 2, playerId: draw2Target.id, playerName: draw2Target.name };
        break;
        
      case 'wild4':
        // Wild Draw Four: Player chooses color, next player draws 4 cards and loses turn
        const wild4Target = room.players[nextPlayerIndex];
        console.log(`${wild4Target.name} draws 4 cards (${room.players.length} players)`);
        
        this.makePlayerDrawCards(room, wild4Target.id, 4);
        
        // Skip the player who drew cards
        room.currentPlayerIndex = this.getNextPlayerIndex(room);
        
        // Apply wild draw four effect for animation
        room.wildEffect = { count: 4, playerId: wild4Target.id, playerName: wild4Target.name };
        break;
        
      case 'wild':
        // Wild: Player chooses color, turn passes normally
        room.currentPlayerIndex = nextPlayerIndex;
        
        // Apply wild effect for animation
        room.wildEffect = { colorChosen: true };
        break;
        
      default:
        // Number cards: Pass turn normally
        room.currentPlayerIndex = nextPlayerIndex;
    }
    
    // Check for winner
    const winner = player.hand.length === 0 ? player : null;
    
    return {
      playedCard: card,
      chosenColor,
      nextPlayerIndex: room.currentPlayerIndex,
      winner,
      gameState: this.getGameState(room)
    };
  }

  makePlayerDrawCards(room, playerId, count) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    
    for (let i = 0; i < count; i++) {
      if (room.deck.length === 0) {
        // Reshuffle discard pile into deck (excluding top card)
        const topCard = room.discardPile.pop();
        
        if (room.discardPile.length > 0) {
          room.deck = room.discardPile;
          room.discardPile = [topCard];
          
          // Shuffle new deck thoroughly
          for (let j = room.deck.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [room.deck[j], room.deck[k]] = [room.deck[k], room.deck[j]];
          }
          
          console.log(`Reshuffled ${room.deck.length} cards from discard pile`);
        } else {
          // No cards to reshuffle
          room.discardPile = [topCard];
          throw new Error('No cards left to draw');
        }
      }
      
      if (room.deck.length > 0) {
        const card = room.deck.pop();
        player.hand.push(card);
      }
    }
    
    player.handCount = player.hand.length;
    room.lastPlayerToCallUno = null;
  }

  callUno(room, playerId) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    
    if (player.hand.length !== 1) {
      throw new Error('Can only call UNO with one card');
    }
    
    room.unoCallRequired = true;
    room.lastPlayerToCallUno = playerId;
  }

  challengeUno(room, challengerId, targetId) {
    const target = room.players.find(p => p.id === targetId);
    if (!target) throw new Error('Target player not found');
    
    if (target.hand.length === 1 && room.lastPlayerToCallUno !== targetId) {
      // Challenge successful - target draws 2 cards
      this.makePlayerDrawCards(room, targetId, 2);
      return { success: true, penaltyCards: 2 };
    }
    
    // Challenge failed - challenger draws 2 cards
    this.makePlayerDrawCards(room, challengerId, 2);
    return { success: false, penaltyCards: 2 };
  }

  getNextPlayerIndex(room) {
    const totalPlayers = room.players.length;
    let nextIndex = (room.currentPlayerIndex + room.direction + totalPlayers) % totalPlayers;
    return nextIndex;
  }

  getGameState(room) {
    return {
      roomId: room.roomId,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        handCount: p.handCount || (p.hand ? p.hand.length : 0),
        connected: p.connected,
        calledUno: p.calledUno || false
      })),
      discardTop: room.discardPile[room.discardPile.length - 1],
      discardPile: room.discardPile, // Full discard pile for better UI
      deckCount: room.deck.length,
      currentPlayerIndex: room.currentPlayerIndex,
      direction: room.direction,
      currentColor: room.currentColor,
      gameStarted: room.gameStarted,
      unoCallRequired: room.unoCallRequired,
      // Power card effects for animations
      skipEffect: room.skipEffect || null,
      reverseEffect: room.reverseEffect || false,
      drawEffect: room.drawEffect || null,
      wildEffect: room.wildEffect || null,
      totalPlayers: room.players.length
    };
  }
}

module.exports = UnoGame;