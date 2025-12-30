# UNO Player Count Implementation Tests

This directory contains complete, separate implementations and tests for UNO games with 2-12 players.

## 📁 Directory Structure

```
player-count-rules/
├── UnoGame2Player.js          # Complete 2-player implementation
├── UnoGame3Player.js          # Complete 3-player implementation
├── UnoGame4Player.js          # Complete 4-player implementation
├── UnoGame5Player.js          # Complete 5-player implementation
├── UnoGame6Player.js          # Complete 6-player implementation
├── UnoGame7Player.js          # Complete 7-player implementation
├── UnoGame8Player.js          # Complete 8-player implementation
├── UnoGame9Player.js          # Complete 9-player implementation
├── UnoGame10Player.js         # Complete 10-player implementation
├── UnoGame11Player.js         # Complete 11-player implementation
├── UnoGame12Player.js         # Complete 12-player implementation
├── generate-player-rules.js   # Script to generate rule files
├── test-2-player.js          # 2-player test suite
├── test-3-player.js          # 3-player test suite
├── test-4-player.js          # 4-player test suite
├── test-5-player.js          # 5-player test suite
├── test-6-player.js          # 6-player test suite
├── test-7-player.js          # 7-player test suite
├── test-8-player.js          # 8-player test suite
├── test-9-player.js          # 9-player test suite
├── test-10-player.js         # 10-player test suite
├── test-11-player.js         # 11-player test suite
├── test-12-player.js         # 12-player test suite
├── generate-player-tests.js    # Script to generate test files
├── run-all-player-tests.js   # Main test runner
└── README.md               # This file
```

## 🎮 Player Count Specific Rules

### 2-Player Special Rules
- **Skip**: Current player plays again (opponent loses turn)
- **Reverse**: Acts exactly like Skip (current player plays again)
- **Draw Two**: Opponent draws 2 cards and loses turn
- **Wild Draw Four**: Opponent draws 4 cards and loses turn
- **Wild**: Normal turn progression after color choice

### 3-12 Players Standard Rules
- **Skip**: Next player loses turn entirely
- **Reverse**: Direction changes only, no player is skipped
- **Draw Two**: Next player draws 2 cards and loses turn
- **Wild Draw Four**: Next player draws 4 cards and loses turn
- **Wild**: Normal turn progression after color choice

## 🧪 Running Tests

### Install Dependencies
```bash
cd V:\work\Game\uno
npm install mocha chai
```

### Run All Player Count Tests
```bash
cd selenium-tests/player-count-rules
node run-all-player-tests.js
```

### Run Specific Player Count Tests
```bash
cd selenium-tests/player-count-rules
node run-all-player-tests.js --players 2,3,4
```

### Validate All Implementations
```bash
cd selenium-tests/player-count-rules
node run-all-player-tests.js --validate
```

### Run Individual Test Suites
```bash
# Test specific player count
cd selenium-tests/player-count-rules
node test-2-player.js
node test-3-player.js
node test-4-player.js

# Or use Mocha directly
mocha test-2-player.js test-3-player.js test-4-player.js
```

## 🧪 Test Coverage

Each player count implementation includes tests for:

### Core Functionality
- ✅ Game room creation and setup
- ✅ Player addition and validation
- ✅ Game initialization with 7 cards each
- ✅ Card playing validation
- ✅ Turn order and progression

### Power Card Rules
- ✅ Skip card behavior
- ✅ Reverse card behavior  
- ✅ Draw Two card behavior
- ✅ Wild Draw Four card behavior
- ✅ Wild card color choice

### Edge Cases
- ✅ Turn order wrapping
- ✅ Direction changes
- ✅ Multiple consecutive power cards
- ✅ Deck reshuffling when empty
- ✅ Game state management

### Player Count Specific Logic
- ✅ 2-player special Skip/Reverse behavior
- ✅ Multi-player standard rules
- ✅ Turn calculation for all player counts
- ✅ Relative positioning
- ✅ Opposite player identification (even counts)

## 🎯 Expected Behaviors by Player Count

### 2 Players
```javascript
// Skip: Player 1 plays -> Player 1 plays again
// Reverse: Player 1 plays -> Player 1 plays again  
// Draw Two: Player 1 plays -> Player 2 draws 2, Player 1 plays again
// Wild Draw Four: Player 1 plays -> Player 2 draws 4, Player 1 plays again
```

### 3+ Players
```javascript
// Skip: Player 1 plays -> Player 2 skipped, Player 3 plays
// Reverse: Player 1 plays -> Direction changes, Player 3 plays
// Draw Two: Player 1 plays -> Player 2 draws 2 and loses turn, Player 3 plays
// Wild Draw Four: Player 1 plays -> Player 2 draws 4 and loses turn, Player 3 plays
```

## 🔧 Implementation Features

Each `UnoGame{N}Player` class includes:

### Core Methods
- `createDeck()` - Creates standard 108-card deck
- `createRoom(roomId)` - Creates game room for N players
- `addPlayer(room, player)` - Adds player with validation
- `startGame(room)` - Deals 7 cards, applies first card effect
- `playCard(room, playerId, cardId, chosenColor)` - Main game logic
- `getGameState(room)` - Returns complete game state

### Helper Methods
- `canPlayCard(card, topCard, currentColor)` - Card validation
- `makePlayerDrawCards(room, playerId, count)` - Card drawing
- `reshuffleDeck(room)` - Deck reshuffling
- `getNextPlayerIndex(room)` - Turn calculation
- `getPlayerCountRules()` - Rule descriptions

### Power Card Effects
- `applySkipCard()` - Skip card logic
- `applyReverseCard()` - Reverse card logic
- `applyDrawTwoCard()` - Draw Two logic
- `applyWildDrawFourCard()` - Wild Draw Four logic

## 🎊 Test Results

Successful test run shows:
- ✅ Player count implementations: 11 passed
- ✅ Individual tests: All power card behaviors validated
- ✅ Turn order: Correct for all player counts
- ✅ Special rules: 2-player exceptions working correctly
- ✅ Edge cases: Wrapping, direction changes, deck reshuffling

## 🚀 Integration with Main Game

To use these implementations in your main UNO game:

```javascript
// Dynamic loading based on player count
function createUnoGame(playerCount) {
  const UnoGameClass = require(`./player-count-rules/UnoGame${playerCount}Player`);
  return new UnoGameClass();
}

// Usage
const game2p = createUnoGame(2);
const game4p = createUnoGame(4);
const game12p = createUnoGame(12);

const room = game4p.createRoom('ROOM123');
// Add players, start game, etc.
```

## 🎮 Game Flow Examples

### 4-Player Skip Card
```
Turn Order: [P1] -> P2 -> P3 -> P4 -> [P1]
P1 plays Skip:
P2 is skipped
Turn Order: [P1] -> P2 -> P3 -> P4 -> P3
Next: P3 plays
```

### 4-Player Reverse Card
```
Direction: Clockwise
Turn Order: [P1] -> P2 -> P3 -> P4 -> [P1]
P1 plays Reverse:
Direction: Counter-clockwise
Turn Order: [P1] -> P4 -> P3 -> P2 -> P4
Next: P4 plays
```

### 2-Player Skip Card
```
Turn Order: [P1] -> P2 -> [P1]
P1 plays Skip:
P2 is skipped
Turn Order: [P1] -> P2 -> P1
Next: P1 plays again (2-player special rule)
```

## 🔍 Debugging

### Common Issues
1. **Turn Calculation**: Ensure modulo arithmetic wraps correctly
2. **Direction Handling**: Reverse should affect all future calculations
3. **Player Count Validation**: Maximum players enforced per implementation
4. **Card Validation**: Wild cards always playable, matching colors/values otherwise

### Logging
Each implementation includes detailed console.log statements:
- Power card effects being applied
- Turn order changes
- Player being skipped/targeted
- Direction reversals

## 📈 Performance Considerations

### Optimizations
- **Deck Management**: Efficient shuffling and reshuffling
- **Turn Calculation**: Constant time modulo arithmetic
- **Effect Clearing**: Proper cleanup between turns
- **State Management**: Complete game state tracking

### Memory Usage
- **Card Objects**: Reused where possible
- **Player Arrays**: Fixed size per player count
- **Effect Tracking**: Cleared after each turn

This comprehensive implementation provides authoritative, tested UNO game logic for every supported player count from 2 to 12 players.