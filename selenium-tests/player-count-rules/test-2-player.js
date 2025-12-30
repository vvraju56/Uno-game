/**
 * 2-Player UNO Game Test Suite
 * Tests all game mechanics for 2-player games
 */

const { assert } = require('chai');
const UnoGame2Player = require('../../player-count-rules/UnoGame2Player');

describe('2-Player UNO Game Tests', function() {
  this.timeout(10000);
  
  let game;
  let room;

  beforeEach(function() {
    game = new UnoGame2Player();
    room = game.createRoom('TEST-2P');
  });

  describe('Game Setup', function() {
    it('should create room for 2 players', function() {
      assert.equal(room.playerCount, 2);
      assert.equal(room.players.length, 0);
      assert.exists(room.deck);
      assert.exists(room.discardPile);
      assert.equal(room.direction, 1); // clockwise
    });

    it('should add exactly 2 players', function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      
      assert.equal(room.players.length, 2);
      assert.throws(() => game.addPlayer(room, { id: 'p3', name: 'Player 3' }), 'Room is full');
    });

    it('should start game with 7 cards each', function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.startGame(room);
      
      assert.equal(room.players[0].handCount, 7);
      assert.equal(room.players[1].handCount, 7);
      assert.isTrue(room.gameStarted);
    });
  });

  describe('2-Player Skip Card Rules', function() {
    beforeEach(function() {
      // Setup game with players
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.startGame(room);
      
      // Give current player a Skip card
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'skip_red', color: 'red', value: 'skip' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should let current player play again after Skip', function() {
      const currentPlayerIndex = room.currentPlayerIndex;
      const result = game.playCard(room, room.players[currentPlayerIndex].id, 'skip_red');
      
      // In 2-player mode, same player should play again
      assert.equal(result.nextPlayerIndex, currentPlayerIndex);
      assert.equal(room.currentPlayerIndex, currentPlayerIndex);
    });

    it('should mark opponent as skipped', function() {
      const currentPlayer = room.players[room.currentPlayerIndex];
      const opponent = room.players[(room.currentPlayerIndex + 1) % 2];
      
      game.playCard(room, currentPlayer.id, 'skip_red');
      
      assert.exists(room.skipEffect);
      assert.equal(room.skipEffect.playerId, opponent.id);
      assert.isTrue(room.skipEffect.currentPlayerKeepsTurn);
    });
  });

  describe('2-Player Reverse Card Rules', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.startGame(room);
      
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'reverse_blue', color: 'blue', value: 'reverse' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should act exactly like Skip in 2-player mode', function() {
      const currentPlayerIndex = room.currentPlayerIndex;
      const result = game.playCard(room, room.players[currentPlayerIndex].id, 'reverse_blue');
      
      // In 2-player mode, same player should play again
      assert.equal(result.nextPlayerIndex, currentPlayerIndex);
      assert.equal(room.currentPlayerIndex, currentPlayerIndex);
    });

    it('should change direction but act as Skip', function() {
      const originalDirection = room.direction;
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'reverse_blue');
      
      // Direction should change
      assert.equal(room.direction, -originalDirection);
      assert.isTrue(room.reverseEffect.actsAsSkip);
    });
  });

  describe('2-Player Draw Two Card Rules', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.startGame(room);
      
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'draw2_green', color: 'green', value: 'draw2' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should make opponent draw 2 cards', function() {
      const opponent = room.players[(room.currentPlayerIndex + 1) % 2];
      const initialHandCount = opponent.handCount;
      
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'draw2_green');
      
      assert.equal(opponent.handCount, initialHandCount + 2);
    });

    it('should let current player play again', function() {
      const currentPlayerIndex = room.currentPlayerIndex;
      const result = game.playCard(room, room.players[currentPlayerIndex].id, 'draw2_green');
      
      // Current player should keep turn in 2-player mode
      assert.equal(result.nextPlayerIndex, currentPlayerIndex);
      assert.equal(room.currentPlayerIndex, currentPlayerIndex);
    });
  });

  describe('2-Player Wild Draw Four Card Rules', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.startGame(room);
      
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'wild4_0', color: 'wild', value: 'wild4' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should make opponent draw 4 cards', function() {
      const opponent = room.players[(room.currentPlayerIndex + 1) % 2];
      const initialHandCount = opponent.handCount;
      
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'wild4_0', 'blue');
      
      assert.equal(opponent.handCount, initialHandCount + 4);
    });

    it('should set chosen color', function() {
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'wild4_0', 'yellow');
      
      assert.equal(room.currentColor, 'yellow');
    });

    it('should let current player play again', function() {
      const currentPlayerIndex = room.currentPlayerIndex;
      const result = game.playCard(room, room.players[currentPlayerIndex].id, 'wild4_0', 'red');
      
      assert.equal(result.nextPlayerIndex, currentPlayerIndex);
      assert.equal(room.currentPlayerIndex, currentPlayerIndex);
    });
  });

  describe('Card Playing Validation', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.startGame(room);
    });

    it('should allow playing matching color cards', function() {
      room.currentColor = 'red';
      const redCard = { id: 'red_5', color: 'red', value: '5' };
      room.players[room.currentPlayerIndex].hand.push(redCard);
      room.players[room.currentPlayerIndex].handCount++;
      
      assert.isTrue(game.canPlayCard(redCard, { color: 'red', value: '3' }, 'red'));
    });

    it('should allow playing matching value cards', function() {
      room.currentColor = 'blue';
      const skipCard = { id: 'red_skip', color: 'red', value: 'skip' };
      room.discardPile.push({ color: 'blue', value: 'skip' });
      room.players[room.currentPlayerIndex].hand.push(skipCard);
      room.players[room.currentPlayerIndex].handCount++;
      
      assert.isTrue(game.canPlayCard(skipCard, { color: 'blue', value: 'skip' }, 'blue'));
    });

    it('should always allow wild cards', function() {
      const wildCard = { id: 'wild_0', color: 'wild', value: 'wild' };
      room.players[room.currentPlayerIndex].hand.push(wildCard);
      room.players[room.currentPlayerIndex].handCount++;
      
      assert.isTrue(game.canPlayCard(wildCard, { color: 'red', value: '3' }, 'red'));
    });
  });

  describe('Game State Management', function() {
    it('should return complete game state', function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.startGame(room);
      
      const gameState = game.getGameState(room);
      
      assert.exists(gameState.roomId);
      assert.isArray(gameState.players);
      assert.equal(gameState.players.length, 2);
      assert.exists(gameState.currentPlayerIndex);
      assert.exists(gameState.direction);
      assert.exists(gameState.currentColor);
      assert.isTrue(gameState.gameStarted);
      assert.isTrue(gameState.twoPlayerRules);
    });
  });

  describe('Rule Descriptions', function() {
    it('should return correct rule descriptions', function() {
      const rules = game.getPlayerCountRules();
      
      assert.equal(rules.playerCount, 2);
      assert.include(rules.description, '2-Player');
      assert.equal(rules.rules.skip, 'Current player plays again (opponent loses turn)');
      assert.equal(rules.rules.reverse, 'Acts exactly like Skip (current player plays again)');
      assert.include(rules.rules.draw2, 'opponent draws 2 cards');
      assert.include(rules.rules.wild4, 'opponent draws 4 cards');
    });
  });
});