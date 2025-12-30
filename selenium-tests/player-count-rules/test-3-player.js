/**
 * 3-Player UNO Game Test Suite
 * Tests all game mechanics for 3-player games
 */

const { assert } = require('chai');
const UnoGame3Player = require('../../player-count-rules/UnoGame3Player');

describe('3-Player UNO Game Tests', function() {
  this.timeout(10000);
  
  let game;
  let room;

  beforeEach(function() {
    game = new UnoGame3Player();
    room = game.createRoom('TEST-3P');
  });

  describe('Game Setup', function() {
    it('should create room for 3 players', function() {
      assert.equal(room.playerCount, 3);
      assert.equal(room.players.length, 0);
      assert.exists(room.deck);
      assert.exists(room.discardPile);
      assert.equal(room.direction, 1); // clockwise
    });

    it('should add exactly 3 players', function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.addPlayer(room, { id: 'p3', name: 'Player 3' });
      
      assert.equal(room.players.length, 3);
      assert.throws(() => game.addPlayer(room, { id: 'p4', name: 'Player 4' }), 'Room is full');
    });

    it('should start game with 7 cards each', function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.addPlayer(room, { id: 'p3', name: 'Player 3' });
      game.startGame(room);
      
      assert.equal(room.players[0].handCount, 7);
      assert.equal(room.players[1].handCount, 7);
      assert.equal(room.players[2].handCount, 7);
      assert.isTrue(room.gameStarted);
    });
  });

  describe('3-Player Skip Card Rules', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.addPlayer(room, { id: 'p3', name: 'Player 3' });
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
      
      // Player after skipped should play
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

  describe('3-Player Reverse Card Rules', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.addPlayer(room, { id: 'p3', name: 'Player 3' });
      game.startGame(room);
      
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'reverse_blue', color: 'blue', value: 'reverse' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should change direction only', function() {
      const originalDirection = room.direction;
      const result = game.playCard(room, room.players[room.currentPlayerIndex].id, 'reverse_blue');
      
      // Direction should change
      assert.equal(room.direction, -originalDirection);
      assert.isTrue(room.reverseEffect);
    });

    it('should play with next player in new direction', function() {
      const originalDirection = room.direction;
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'reverse_blue');
      
      // Next player in new direction should play
      const expectedNextIndex = (room.currentPlayerIndex + room.direction + 3) % 3;
      assert.equal(room.currentPlayerIndex, expectedNextIndex);
    });

    it('should not skip any player', function() {
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'reverse_blue');
      
      // Should not have skip effect
      assert.notExists(room.skipEffect);
    });
  });

  describe('3-Player Draw Two Card Rules', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.addPlayer(room, { id: 'p3', name: 'Player 3' });
      game.startGame(room);
      
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'draw2_green', color: 'green', value: 'draw2' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should make next player draw 2 cards', function() {
      const nextPlayerIndex = game.getNextPlayerIndex(room);
      const targetPlayer = room.players[nextPlayerIndex];
      const initialHandCount = targetPlayer.handCount;
      
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'draw2_green');
      
      assert.equal(targetPlayer.handCount, initialHandCount + 2);
    });

    it('should make next player lose turn', function() {
      const nextPlayerIndex = game.getNextPlayerIndex(room);
      const playerAfterTargetIndex = game.getNextPlayerIndexFrom(room, nextPlayerIndex);
      
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'draw2_green');
      
      // Player after target should play
      assert.equal(room.currentPlayerIndex, playerAfterTargetIndex);
    });
  });

  describe('3-Player Wild Draw Four Card Rules', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.addPlayer(room, { id: 'p3', name: 'Player 3' });
      game.startGame(room);
      
      room.players[room.currentPlayerIndex].hand.push(
        { id: 'wild4_0', color: 'wild', value: 'wild4' }
      );
      room.players[room.currentPlayerIndex].handCount++;
    });

    it('should make next player draw 4 cards', function() {
      const nextPlayerIndex = game.getNextPlayerIndex(room);
      const targetPlayer = room.players[nextPlayerIndex];
      const initialHandCount = targetPlayer.handCount;
      
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'wild4_0', 'blue');
      
      assert.equal(targetPlayer.handCount, initialHandCount + 4);
    });

    it('should set chosen color', function() {
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'wild4_0', 'yellow');
      
      assert.equal(room.currentColor, 'yellow');
    });

    it('should make next player lose turn', function() {
      const nextPlayerIndex = game.getNextPlayerIndex(room);
      const playerAfterTargetIndex = game.getNextPlayerIndexFrom(room, nextPlayerIndex);
      
      game.playCard(room, room.players[room.currentPlayerIndex].id, 'wild4_0', 'red');
      
      assert.equal(room.currentPlayerIndex, playerAfterTargetIndex);
    });
  });

  describe('3-Player Turn Order Logic', function() {
    beforeEach(function() {
      game.addPlayer(room, { id: 'p1', name: 'Player 1' });
      game.addPlayer(room, { id: 'p2', name: 'Player 2' });
      game.addPlayer(room, { id: 'p3', name: 'Player 3' });
      game.startGame(room);
    });

    it('should wrap around correctly in clockwise direction', function() {
      // Set up scenario where current player is last in array
      room.currentPlayerIndex = 2; // Player 3
      room.direction = 1; // clockwise
      
      const nextIndex = game.getNextPlayerIndex(room);
      assert.equal(nextIndex, 0); // Should wrap to Player 1
    });

    it('should wrap around correctly in counter-clockwise direction', function() {
      room.currentPlayerIndex = 0; // Player 1
      room.direction = -1; // counter-clockwise
      
      const nextIndex = game.getNextPlayerIndex(room);
      assert.equal(nextIndex, 2); // Should go to Player 3
    });

    it('should calculate relative positions correctly', function() {
      room.currentPlayerIndex = 1; // Player 2
      room.direction = 1; // clockwise
      
      const positions = [
        { index: 0, expected: 'previous' },  // Player 1 is previous
        { index: 1, expected: 'current' },   // Player 2 is current
        { index: 2, expected: 'next' }      // Player 3 is next
      ];
      
      positions.forEach(({ index, expected }) => {
        const relativePos = (index - room.currentPlayerIndex + 3 + 3 * 3) % 3;
        let actual;
        if (relativePos === 0) actual = 'current';
        else if (relativePos === 1) actual = 'next';
        else if (relativePos === 2) actual = 'previous';
        
        assert.equal(actual, expected);
      });
    });
  });

  describe('Rule Descriptions', function() {
    it('should return correct rule descriptions', function() {
      const rules = game.getPlayerCountRules();
      
      assert.equal(rules.playerCount, 3);
      assert.include(rules.description, '3-Player');
      assert.include(rules.rules.skip, 'Next player loses turn');
      assert.include(rules.rules.reverse, 'Direction changes only');
      assert.include(rules.rules.draw2, 'draws 2 cards');
      assert.include(rules.rules.wild4, 'draws 4 cards');
    });
  });
});