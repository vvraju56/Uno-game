/**
 * 4-Player UNO Game Test Suite
 * Tests all game mechanics for 4-player games
 */

const { assert } = require('chai');
const UnoGame4Player = require('../../player-count-rules/UnoGame4Player');

describe('4-Player UNO Game Tests', function() {
  this.timeout(10000);
  
  let game;
  let room;

  beforeEach(function() {
    game = new UnoGame4Player();
    room = game.createRoom('TEST-4P');
  });

  describe('Game Setup', function() {
    it('should create room for 4 players', function() {
      assert.equal(room.playerCount, 4);
      assert.equal(room.players.length, 0);
      assert.exists(room.deck);
      assert.exists(room.discardPile);
      assert.equal(room.direction, 1); // clockwise
    });

    it('should add exactly 4 players', function() {
      for (let i = 1; i <= 4; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      
      assert.equal(room.players.length, 4);
      assert.throws(() => game.addPlayer(room, { id: 'p5', name: 'Player 5' }), 'Room is full');
    });
  });

  describe('4-Player Skip Card Rules', function() {
    beforeEach(function() {
      for (let i = 1; i <= 4; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
      
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'skip_red', color: 'red', value: 'skip' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should skip next player and play with player after', function() {
      const currentPlayerIndex = room.currentPlayerIndex;
      const nextPlayerIndex = game.getNextPlayerIndex(room);
      const playerAfterNextIndex = game.getNextPlayerIndexFrom(room, nextPlayerIndex);
      
      const result = game.playCard(room, room.players[currentPlayerIndex].id, 'skip_red');
      
      assert.equal(result.nextPlayerIndex, playerAfterNextIndex);
      assert.equal(room.currentPlayerIndex, playerAfterNextIndex);
    });

    it('should mark correct player as skipped', function() {
      const currentPlayerIndex = room.currentPlayerIndex;
      const nextPlayerIndex = game.getNextPlayerIndex(room);
      const nextPlayer = room.players[nextPlayerIndex];
      
      game.playCard(room, room.players[currentPlayerIndex].id, 'skip_red');
      
      assert.exists(room.skipEffect);
      assert.equal(room.skipEffect.playerId, nextPlayer.id);
      assert.equal(room.skipEffect.skippedPlayerIndex, nextPlayerIndex);
    });
  });

  describe('4-Player Reverse Card Rules', function() {
    beforeEach(function() {
      for (let i = 1; i <= 4; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
      
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'reverse_blue', color: 'blue', value: 'reverse' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should change direction only', function() {
      const originalDirection = room.direction;
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'reverse_blue');
      
      assert.equal(room.direction, -originalDirection);
      assert.isTrue(room.reverseEffect);
    });

    it('should not skip any player', function() {
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'reverse_blue');
      
      assert.notExists(room.skipEffect);
    });
  });

  describe('4-Player Opposite Player Logic', function() {
    beforeEach(function() {
      for (let i = 1; i <= 4; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
    });

    it('should identify opposite player correctly', function() {
      room.currentPlayerIndex = 0; // Player 1
      room.direction = 1; // clockwise
      
      // In 4-player game, opposite is 2 positions away
      const relativeIndex = (2 - room.currentPlayerIndex + 4 + 4 * 4) % 4; // Normalize to 0-3
      
      assert.equal(relativeIndex, 2); // Player 3 should be opposite
      
      // Test from other positions
      room.currentPlayerIndex = 1; // Player 2
      const oppositeFromPlayer2 = (3 - room.currentPlayerIndex + 4 + 4 * 4) % 4;
      assert.equal(oppositeFromPlayer2, 0); // Player 1 should be opposite
    });
  });

  describe('4-Player Turn Order Wrapping', function() {
    beforeEach(function() {
      for (let i = 1; i <= 4; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
    });

    it('should wrap correctly in both directions', function() {
      // Test clockwise wrapping
      room.currentPlayerIndex = 3; // Last player
      room.direction = 1;
      const nextFrom3 = game.getNextPlayerIndex(room);
      assert.equal(nextFrom3, 0); // Should wrap to first
      
      // Test counter-clockwise wrapping
      room.currentPlayerIndex = 0; // First player
      room.direction = -1;
      const nextFrom0 = game.getNextPlayerIndex(room);
      assert.equal(nextFrom0, 3); // Should wrap to last
    });
  });

  describe('4-Player Multiple Power Cards', function() {
    beforeEach(function() {
      for (let i = 1; i <= 4; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
    });

    it('should handle consecutive power cards correctly', function() {
      // Play Skip
      room.players[0].hand.push({ id: 'skip_red', color: 'red', value: 'skip' });
      room.players[0].handCount++;
      game.playCard(room, 'p1', 'skip_red');
      
      // Should now be player 3's turn (player 2 skipped)
      assert.equal(room.currentPlayerIndex, 2);
      
      // Play Reverse from player 3
      room.players[2].hand.push({ id: 'reverse_blue', color: 'blue', value: 'reverse' });
      room.players[2].handCount++;
      game.playCard(room, 'p3', 'reverse_blue');
      
      // Direction should reverse, player 2 should play
      assert.equal(room.direction, -1);
      assert.equal(room.currentPlayerIndex, 1);
      
      // Play Draw Two from player 2
      room.players[1].hand.push({ id: 'draw2_green', color: 'green', value: 'draw2' });
      room.players[1].handCount++;
      game.playCard(room, 'p2', 'draw2_green');
      
      // Player 1 should draw 2 and lose turn, player 4 should play
      assert.equal(room.currentPlayerIndex, 3);
      assert.exists(room.drawEffect);
    });
  });

  describe('Rule Descriptions', function() {
    it('should return correct rule descriptions', function() {
      const rules = game.getPlayerCountRules();
      
      assert.equal(rules.playerCount, 4);
      assert.include(rules.description, '4-Player');
      assert.include(rules.rules.skip, 'Next player loses turn');
      assert.include(rules.rules.reverse, 'Direction changes only');
      assert.include(rules.rules.draw2, 'draws 2 cards');
      assert.include(rules.rules.wild4, 'draws 4 cards');
    });
  });
});