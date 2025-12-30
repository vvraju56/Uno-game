# UNO Power Card Selenium Tests

This directory contains comprehensive Selenium tests for validating UNO power card rules across 2-12 players.

## Test Structure

### Power Card Rule Files
- `power-cards/PowerCardRules2Player.js` through `PowerCardRules12Player.js`
- Each file contains authoritative rules for specific player counts
- Implements Skip, Reverse, Draw Two, Wild, and Wild Draw Four behaviors

### Test Configuration
- `config.js` - Selenium WebDriver configuration
- `UnoGameTestHelper.js` - Helper methods for UNO game interactions

### Test Suites
- `power-cards/PowerCardTestSuite.js` - Comprehensive test suite for all power cards
- Individual player count directories (`2-player/`, `3-player/`, etc.)

## Power Card Rules Summary

### 2 Players
- **Skip**: Acts like current player keeps turn (opponent loses turn)
- **Reverse**: Acts exactly like Skip (current player plays again)
- **Draw Two**: Opponent draws 2 cards and loses turn
- **Wild Draw Four**: Opponent draws 4 cards and loses turn

### 3-12 Players (Standard Rules)
- **Skip**: Next player loses turn entirely
- **Reverse**: Direction changes only, no player is skipped
- **Draw Two**: Next player draws 2 cards and loses turn
- **Wild Draw Four**: Next player draws 4 cards and loses turn

## Running Tests

### Prerequisites
1. Start UNO server:
   ```bash
   node server.js
   # OR
   npm run start-for-testing
   ```

2. Install dependencies:
   ```bash
   npm run install-selenium
   ```

### Run All Tests
```bash
npm test
# OR
npm run test:power-cards
# OR
node selenium-tests/run-tests.js
```

### Run Specific Tests
```bash
# Run tests for specific player count
mocha selenium-tests/2-player/*.test.js
mocha selenium-tests/4-player/*.test.js
```

## Test Coverage

### Power Cards Tested
- ✅ Skip Card (2-12 players)
- ✅ Reverse Card (2-12 players)  
- ✅ Draw Two Card (2-12 players)
- ✅ Wild Draw Four Card (2-12 players)
- ✅ Wild Card (2-12 players)

### Player Counts Tested
- ✅ 2 Players (special rules)
- ✅ 3 Players (standard rules)
- ✅ 4 Players (standard rules)
- ✅ 5 Players (standard rules)
- ✅ 6 Players (standard rules)
- ✅ 7 Players (standard rules)
- ✅ 8 Players (standard rules)
- ✅ 9 Players (standard rules)
- ✅ 10 Players (standard rules)
- ✅ 11 Players (standard rules)
- ✅ 12 Players (standard rules)

## Test Scenarios

### Each test validates:
1. **Correct turn advancement** - Player who should play next has turn
2. **Correct card drawing** - Target players draw correct number of cards
3. **Correct direction changes** - Reverse cards properly change direction
4. **Special 2-player behavior** - Reverse acts like Skip in 2-player games
5. **Color changes** - Wild cards properly set colors
6. **Game state consistency** - Game remains in valid state after effects

## Expected Behaviors

### Skip Card
- **2 Players**: Current player plays again
- **3+ Players**: Next player is skipped, player after them plays

### Reverse Card  
- **2 Players**: Acts exactly like Skip (current player plays again)
- **3+ Players**: Direction changes, next player in new direction plays

### Draw Two Card
- **All Players**: Next player draws 2 cards and loses turn

### Wild Draw Four Card
- **All Players**: Player chooses color, next player draws 4 cards and loses turn

## Debugging

### Screenshots
Tests automatically take screenshots on failures:
- `skip-error-{count}.png`
- `reverse-error-{count}.png`
- `draw2-error-{count}.png`
- `wild4-error-{count}.png`

### Console Output
Tests provide detailed logging:
- Player count and current player
- Expected vs actual behavior
- Success/failure status

## Environment Variables

- `TEST_BASE_URL` - Base URL for tests (default: http://localhost:3001)
- `CI` - Run tests in headless mode
- `HEADLESS` - Force headless mode

## Troubleshooting

### Common Issues

1. **Server not available**
   - Make sure UNO server is running on port 3001
   - Check firewall settings

2. **ChromeDriver issues**
   - Ensure ChromeDriver version matches Chrome version
   - Update ChromeDriver: `npm install chromedriver@latest`

3. **Timeout errors**
   - Increase timeout in test configuration
   - Check system performance

4. **Element not found**
   - Verify HTML element IDs in UnoApp.jsx
   - Check page loading speed

### Manual Testing
For quick verification without full Selenium setup:
```bash
# Test power card rules directly
node -e "
const PowerCardRules2Player = require('./power-cards/PowerCardRules2Player.js');
const rules2 = new PowerCardRules2Player();
console.log(rules2.getPowerCardDescription('skip'));
"
```