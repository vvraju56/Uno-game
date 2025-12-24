class UnoGame {
  constructor(useExpansionCards = false) {
    this.colors = ['red', 'blue', 'green', 'yellow'];
    this.validWildColors = ['red', 'blue', 'green', 'yellow'];
    this.numberValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    this.actionValues = ['skip', 'reverse', 'draw2'];
    this.values = [...this.numberValues, ...this.actionValues];
    this.wildCards = ['wild', 'wild4'];
    this.expansionWildCards = useExpansionCards ? ['wildSwap', 'wildShuffle', 'wildCustom'] : [];
    this.useExpansionCards = useExpansionCards;
  }

  createDeck() {
    const deck = [];
    
    for (const color of this.colors) {
      deck.push({ id: `${color}_0`, color, value: '0' });
      
      for (const value of this.numberValues.slice(1)) {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      }
      
      for (const value of this.actionValues) {
        deck.push({ id: `${color}_${value}_1`, color, value });
        deck.push({ id: `${color}_${value}_2`, color, value });
      }
    }
    
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `wild_${i}`, color: 'wild', value: 'wild' });
      deck.push({ id: `wild4_${i}`, color: 'wild', value: 'wild4' });
    }
    
    if (this.useExpansionCards) {
      for (let i = 0; i < 4; i++) {
        deck.push({ id: `wildSwap_${i}`, color: 'wild', value: 'wildSwap' });
        deck.push({ id: `wildShuffle_${i}`, color: 'wild', value: 'wildShuffle' });
      }
      for (let i = 0; i < 3; i++) {
        deck.push({ id: `wildCustom_${i}`, color: 'wild', value: 'wildCustom' });
      }
    }
    
    const expectedSize = this.useExpansionCards ? 123 : 108;
    if (deck.length !== expectedSize) {
      throw new Error(`Deck has ${deck.length} cards, should have ${expectedSize}`);
    }
    
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

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
    if (['wildSwap', 'wildShuffle', 'wildCustom'].includes(card.value)) {
      return 40;
    }
    return 0;
  }

  createRoom(roomId, customRules = {}) {
    const deck = this.createDeck();
    const discardPile = [];
    
    let firstCard;
    do {
      firstCard = deck.pop();
      if (firstCard.value === 'wild4' || firstCard.value === 'wildSwap' || 
          firstCard.value === 'wildShuffle' || firstCard.value === 'wildCustom') {
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
      direction: 1,
      currentColor: firstCard.color === 'wild' ? null : firstCard.color,
      gameStarted: false,
      unoCallRequired: false,
      lastPlayerToCallUno: null,
      firstCardEffect: firstCard.value,
      scores: {},
      customRules: customRules,
      wild4ChallengeWindow: false,
      wild4ChallengableBy: null
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
    
    const firstCard = room.discardPile[0];
    if (firstCard.value === 'skip') {
      room.currentPlayerIndex = this.getNextPlayerIndex(room);
    } else if (firstCard.value === 'reverse') {
      room.direction *= -1;
      if (room.players.length === 2) {
        room.currentPlayerIndex = this.getNextPlayerIndex(room);
      }
    } else if (firstCard.value === 'draw2') {
      const firstPlayer = room.players[0];
      this.makePlayerDrawCards(room, firstPlayer.id, 2);
      room.currentPlayerIndex = this.getNextPlayerIndex(room);
    } else if (firstCard.value === 'wild') {
      room.currentColor = room.colors[Math.floor(Math.random() * room.colors.length)];
    }
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

  playCard(room, playerId, cardId, chosenColor = null, challengeWild4 = false, targetPlayerId = null, customRule = null) {
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
    
    const isWinningCard = player.hand.length === 1;
    
    if (card.value === 'wild4') {
      const hasMatchingColor = player.hand.some(c => c.color === room.currentColor && c.id !== cardId);
      room.wild4Illegal = hasMatchingColor;
      room.wild4PlayerId = playerId;
      room.wild4HandSnapshot = [...player.hand];
      
      const nextPlayerIndex = this.getNextPlayerIndex(room);
      room.wild4ChallengableBy = room.players[nextPlayerIndex].id;
      room.wild4ChallengeWindow = true;
    }
    
    if (card.value === 'wildSwap' && !targetPlayerId) {
      throw new Error('Must specify target player for Wild Swap Hands');
    }
    
    if (card.value === 'wildCustom' && !customRule) {
      throw new Error('Must specify custom rule for Wild Customizable');
    }
    
    if (player.hand.length === 2 && room.unoCallRequired && room.lastPlayerToCallUno !== playerId) {
      throw new Error('Must call UNO when you have one card left');
    }
    
    player.hand.splice(cardIndex, 1);
    player.handCount = player.hand.length;
    room.discardPile.push(card);
    
    if (card.color === 'wild') {
      if (this.validWildColors.includes(chosenColor)) {
        room.currentColor = chosenColor;
      } else {
        room.currentColor = chosenColor || 'red';
      }
    } else {
      room.currentColor = card.color;
    }
    
    room.unoCallRequired = false;
    room.lastPlayerToCallUno = null;
    
    let nextPlayerIndex = this.getNextPlayerIndex(room);
    
    switch (card.value) {
      case 'skip':
        const skippedPlayer = room.players[nextPlayerIndex];
        console.log(`${skippedPlayer.name} skipped (${room.players.length} players)`);
        
        if (room.players.length === 2) {
          // In 2-player mode, Skip acts exactly like Reverse - same player plays again
          const nextToSkip = room.players[nextPlayerIndex];
          room.currentPlayerIndex = this.getNextPlayerIndex(room);
          room.skipEffect = { playerId: nextToSkip.id, playerName: nextToSkip.name };
        } else {
          // In 3+ player mode, skip the next player
          room.currentPlayerIndex = this.getNextPlayerIndex(room);
          room.skipEffect = { playerId: skippedPlayer.id, playerName: skippedPlayer.name };
        }
        break;
        
      case 'reverse':
        room.direction *= -1;
        console.log(`Direction reversed to ${room.direction > 0 ? 'clockwise' : 'counter-clockwise'} (${room.players.length} players)`);
        
        if (room.players.length === 2) {
          const skippedPlayer = room.players[nextPlayerIndex];
          room.currentPlayerIndex = this.getNextPlayerIndex(room);
          room.skipEffect = { playerId: skippedPlayer.id, playerName: skippedPlayer.name };
        } else {
          room.currentPlayerIndex = nextPlayerIndex;
        }
        room.reverseEffect = true;
        break;
        
      case 'draw2':
        const draw2Target = room.players[nextPlayerIndex];
        console.log(`${draw2Target.name} draws 2 cards and loses turn (${room.players.length} players)`);
        this.makePlayerDrawCards(room, draw2Target.id, 2);
        
        room.currentPlayerIndex = this.getNextPlayerIndex(room);
        room.drawEffect = { 
          count: 2, 
          playerId: draw2Target.id, 
          playerName: draw2Target.name,
          canStack: false,
          turnSkipped: true
        };
        break;
        
      case 'wild4':
        const wild4Target = room.players[nextPlayerIndex];
        console.log(`${wild4Target.name} targeted by Wild Draw Four (${room.players.length} players)`);
        
        this.makePlayerDrawCards(room, wild4Target.id, 4);
        
        room.currentPlayerIndex = this.getNextPlayerIndex(room);
        room.wildEffect = { 
          count: 4, 
          playerId: wild4Target.id, 
          playerName: wild4Target.name,
          challengeable: true,
          turnSkipped: true
        };
        break;
        
      case 'wild':
        room.currentPlayerIndex = nextPlayerIndex;
        room.wildEffect = { colorChosen: true };
        break;
        
      case 'wildSwap':
        if (!isWinningCard) {
          const targetPlayer = room.players.find(p => p.id === targetPlayerId);
          if (!targetPlayer) throw new Error('Target player not found');
          
          const tempHand = [...player.hand];
          player.hand = [...targetPlayer.hand];
          targetPlayer.hand = tempHand;
          
          player.handCount = player.hand.length;
          targetPlayer.handCount = targetPlayer.hand.length;
          
          room.swapEffect = { 
            fromPlayer: player.name, 
            toPlayer: targetPlayer.name 
          };
        }
        room.currentPlayerIndex = nextPlayerIndex;
        room.wildEffect = { colorChosen: true };
        break;
        
      case 'wildShuffle':
        if (!isWinningCard) {
          const allCards = [];
          for (const p of room.players) {
            allCards.push(...p.hand);
            p.hand = [];
            p.handCount = 0;
          }
          
          for (let i = allCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
          }
          
          let cardIndex = 0;
          let dealFromIndex = nextPlayerIndex;
          for (let i = 0; i < room.players.length; i++) {
            const pIndex = (dealFromIndex + i) % room.players.length;
            const cardsToDeal = Math.floor(allCards.length / room.players.length) + 
              (i < (allCards.length % room.players.length) ? 1 : 0);
            
            for (let j = 0; j < cardsToDeal && cardIndex < allCards.length; j++) {
              room.players[pIndex].hand.push(allCards[cardIndex++]);
            }
            room.players[pIndex].handCount = room.players[pIndex].hand.length;
          }
          
          room.shuffleEffect = { triggered: true };
        }
        room.currentPlayerIndex = nextPlayerIndex;
        room.wildEffect = { colorChosen: true };
        break;
        
      case 'wildCustom':
        if (customRule && room.customRules && room.customRules[customRule]) {
          room.customRules[customRule](room, playerId);
        }
        room.currentPlayerIndex = nextPlayerIndex;
        room.wildEffect = { colorChosen: true, customRule };
        break;
        
      default:
        room.currentPlayerIndex = nextPlayerIndex;
    }
    
    const winner = player.hand.length === 0 ? player : null;
    
    if (winner) {
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
      this.makePlayerDrawCards(room, targetId, 2);
      return { success: true, penaltyCards: 2 };
    }
    
    this.makePlayerDrawCards(room, challengerId, 2);
    return { success: false, penaltyCards: 2 };
  }

  challengeWild4(room, challengerId) {
    if (!room.wild4ChallengeWindow) {
      throw new Error('Challenge window has closed');
    }
    
    if (challengerId !== room.wild4ChallengableBy) {
      throw new Error('Only the affected player may challenge');
    }
    
    room.wild4ChallengeWindow = false;
    
    const offender = room.players.find(p => p.id === room.wild4PlayerId);
    const challenger = room.players.find(p => p.id === challengerId);
    
    if (room.wild4Illegal) {
      const returnCardIndex = room.discardPile.findIndex(c => 
        c.value === 'wild4' && room.discardPile[room.discardPile.length - 1] === c
      );
      
      if (returnCardIndex !== -1 && room.wild4HandSnapshot) {
        room.discardPile.pop();
        offender.hand = [...room.wild4HandSnapshot];
        offender.handCount = offender.hand.length;
        
        const targetIndex = room.players.findIndex(p => p.id === challengerId);
        room.currentPlayerIndex = targetIndex;
      }
      
      this.makePlayerDrawCards(room, room.wild4PlayerId, 4);
      
      const result = { 
        success: true, 
        penaltyCards: 4, 
        offender: offender.name,
        challenger: challenger.name,
        reason: 'Had matching color card'
      };
      
      room.wild4PlayerId = null;
      room.wild4Illegal = null;
      room.wild4HandSnapshot = null;
      room.wild4ChallengableBy = null;
      
      return result;
    } else {
      this.makePlayerDrawCards(room, challengerId, 6);
      
      const result = { 
        success: false, 
        penaltyCards: 6, 
        offender: offender.name,
        challenger: challenger.name,
        reason: 'Wild Draw Four was legal'
      };
      
      room.wild4PlayerId = null;
      room.wild4Illegal = null;
      room.wild4HandSnapshot = null;
      room.wild4ChallengableBy = null;
      
      return result;
    }
  }

  canStackDrawTwo(room, playerId) {
    return false;
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
        calledUno: p.calledUno || false,
        score: room.scores[p.id] || 0
      })),
      discardTop: room.discardPile[room.discardPile.length - 1],
      discardPile: room.discardPile,
      deckCount: room.deck.length,
      currentPlayerIndex: room.currentPlayerIndex,
      direction: room.direction,
      currentColor: room.currentColor,
      gameStarted: room.gameStarted,
      unoCallRequired: room.unoCallRequired,
      skipEffect: room.skipEffect || null,
      reverseEffect: room.reverseEffect || false,
      drawEffect: room.drawEffect || null,
      wildEffect: room.wildEffect || null,
      totalPlayers: room.players.length,
      scores: room.scores,
      roundWinner: room.roundWinner,
      gameWinner: room.gameWinner,
      wild4Challengeable: room.wild4PlayerId ? true : false
    };
  }
}

module.exports = UnoGame;