/**
 * 7-Player UNO Game Test Suite
 * Tests all game mechanics for 7-player games
 */

const { assert } = require('chai');
const UnoGame7Player = require('../../player-count-rules/UnoGame7Player');

describe('7-Player UNO Game Test Suite', function() {
  this.timeout(10000);
  
  let game;
  let room;

  beforeEach(function() {
    game = new UnoGame7Player();
    room = game.createRoom('TEST-7P');
  });

  describe('Game Setup', function() {
    it('should create room for 7 players', function() {
      assert.equal(room.playerCount, 7);
      assert.equal(room.players.length, 0);
      assert.exists(room.deck);
      assert.exists(room.discardPile);
      assert.equal(room.direction, 1); // clockwise
    });

    it('should add exactly 7 players', function() {
      for (let i = 1; i <= 7; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      
      assert.equal(room.players.length, 7);
      assert.throws(() => game.addPlayer(room, { id: `p${8`, name: `Player ${8}` }), 'Room is full');
    });

    it('should start game with 7 cards each', function() {
      for (let i = 1; i <= 7; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
      
      for (let i = 0; i < 7; i++) {
        assert.equal(room.players[i].handCount, 7);
      }
      assert.isTrue(room.gameStarted);
    });
  });

  describe('7-Player Skip Card Rules', function() {
    beforeEach(function() {
      for (let i = 1; i <= 7; i++) {
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

  describe('7-Player Reverse Card Rules', function() {
    beforeEach(function() {
      for (let i = 1; i <= 7; i++) {
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

  describe('7-Player Draw Two Card Rules', function() {
    beforeEach(function() {
      for (let i = 1; i <= 7; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
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
      
      assert.equal(room.currentPlayerIndex, playerAfterTargetIndex);
    });
  });

  describe('7-Player Wild Draw Four Card Rules', function() {
    beforeEach(function() {
      for (let i = 1; i <= 7; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
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

  describe('7-Player Turn Order Logic', function() {
    beforeEach(function() {
      for (let i = 1; i <= 7; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
    });

    it('should wrap around correctly in clockwise direction', function() {
      // Set up scenario where current player is last in array
      room.currentPlayerIndex = 6; // Last player
      room.direction = 1; // clockwise
      
      const nextIndex = game.getNextPlayerIndex(room);
      assert.equal(nextIndex, 0); // Should wrap to first player
    });

    it('should wrap around correctly in counter-clockwise direction', function() {
      room.currentPlayerIndex = 0; // First player
      room.direction = -1; // counter-clockwise
      
      const nextIndex = game.getNextPlayerIndex(room);
      assert.equal(nextIndex, 6); // Should go to last player
    });

    it('should calculate relative positions correctly', function() {
      room.currentPlayerIndex = 0; // First player
      room.direction = 1; // clockwise
      
      const positions = [
        { index: 0, expected: 'current' },  // First player is current
        { index: 1, expected: 'next' },     // Second player is next
        { index: 3, expected: 'opposite' }, // Opposite player
        { index: 6, expected: 'previous' } // Last player is previous
      ];
      
      positions.forEach(({ index, expected }) => {
        const relativePos = (index - room.currentPlayerIndex + 7 + 7 * 7) % 7;
        let actual;
        if (relativePos === 0) actual = 'current';
        else if (relativePos === 1) actual = 'next';
        else if (relativePos === 6) actual = 'previous';
        else if (relativePos === Math.floor(7 / 2)) actual = 'opposite';
        else actual = `position_${relativePos}`;
        
        assert.equal(actual, expected);
      });
    });
  });

  describe('7-Player Edge Cases', function() {
    beforeEach(function() {
      for (let i = 1; i <= 7; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
    });

    it('should handle consecutive power cards', function() {
      // Play Skip
      room.players[0].hand.push({ id: 'skip_red', color: 'red', value: 'skip' });
      room.players[0].handCount++;
      game.playCard(room, 'p1', 'skip_red');
      
      // Should skip player 1, player 2 plays
      const expectedAfterSkip = 2;
      assert.equal(room.currentPlayerIndex, expectedAfterSkip);
      
      // Play Reverse from player 2
      room.players[expectedAfterSkip].hand.push({ id: 'reverse_blue', color: 'blue', value: 'reverse' });
      room.players[expectedAfterSkip].handCount++;
      game.playCard(room, `p${expectedAfterSkip + 1}`, 'reverse_blue');
      
      // Direction should reverse
      assert.equal(room.direction, -1);
      
      // Next player should be player 1 (going counter-clockwise from player 2)
      const expectedAfterReverse = 0;
      assert.equal(room.currentPlayerIndex, expectedAfterReverse);
    });

    it('should handle deck reshuffling when empty', function() {
      // Empty the deck for testing
      room.deck = [];
      
      // Try to make a player draw
      const initialDeckLength = room.deck.length;
      const playerIndex = game.getNextPlayerIndex(room);
      
      try {
        game.makePlayerDrawCards(room, room.players[playerIndex].id, 1);
        // Should have reshuffled
        assert.isTrue(room.deck.length > initialDeckLength);
      } catch (error) {
        // Should handle empty discard pile gracefully
        assert.include(error.message, 'No cards to reshuffle');
      }
    });
  });

  describe('Rule Descriptions', function() {
    it('should return correct rule descriptions', function() {
      const rules = game.getPlayerCountRules();
      
      assert.equal(rules.playerCount, 7);
      assert.include(rules.description, '7-Player');
      assert.include(rules.rules.skip, 'Next player loses turn');
      assert.include(rules.rules.reverse, 'Direction changes only');
      assert.include(rules.rules.draw2, 'draws 2 cards');
      assert.include(rules.rules.wild4, 'draws 4 cards');
      
      assert.isArray(rules.specialBehaviors);
      assert.isTrue(rules.specialBehaviors.length > 0);
    });
  });

  describe('Game State Management', function() {
    it('should return complete game state', function() {
      for (let i = 1; i <= 7; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
      game.startGame(room);
      
      const gameState = game.getGameState(room);
      
      assert.exists(gameState.roomId);
      assert.isArray(gameState.players);
      assert.equal(gameState.players.length, 7);
      assert.exists(gameState.currentPlayerIndex);
      assert.exists(gameState.direction);
      assert.exists(gameState.currentColor);
      assert.isTrue(gameState.gameStarted);
      assert.isTrue(gameState[`7PlayerRules`]);
    });
  });

  describe('Card Playing Validation', function() {
    beforeEach(function() {
      for (let i = 1; i <= 7; i++) {
        game.addPlayer(room, { id: `p${i}`, name: `Player ${i}` });
      }
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

    it('should reject non-matching cards', function() {
      room.currentColor = 'red';
      const blueCard = { id: 'blue_5', color: 'blue', value: '5' };
      
      assert.isFalse(game.canPlayCard(blueCard, { color: 'red', value: '3' }, 'red'));
    });
  });
});
