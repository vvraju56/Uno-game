# UNO Multiplayer Game

A real-time multiplayer UNO card game built with Node.js, Socket.IO, and vanilla JavaScript.

## Features

- **Real-time multiplayer gameplay** for 2-6 players
- **Server-authoritative game logic** prevents cheating
- **Full UNO rules implementation** including:
  - Number cards, Skip, Reverse, Draw Two
  - Wild cards and Wild Draw Four
  - UNO calling and challenging
  - Proper deck reshuffling
- **Smooth, responsive UI** with animations
- **Mobile-friendly** responsive design
- **Room-based** lobby system

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser and go to `http://localhost:3000`

4. Open multiple browser tabs to test multiplayer

## Game Rules

### Setup
- Each player starts with 7 cards
- First card on discard pile cannot be wild
- Game progresses clockwise

### Playing Cards
Play a card if it matches:
- **Color** (red, yellow, green, blue)
- **Value** (same number/action)
- **Wild card** (any time)

### Card Effects
- **Skip**: Next player loses turn
- **Reverse**: Changes direction (acts as Skip with 2 players)
- **Draw Two**: Next player draws 2 cards and loses turn
- **Wild**: Choose next color
- **Wild Draw Four**: Choose color, next player draws 4 and loses turn

### UNO Rules
- Call "UNO" when you have one card left
- If caught failing to call UNO, draw 2 penalty cards
- Other players can challenge if you forget to call UNO

### Drawing Cards
- Draw 1 card if you cannot play
- If drawn card is playable, you may play it immediately
- If not, your turn ends

### Winning
- First player to empty their hand wins
- Game shows winner and allows replay

## Controls

### Keyboard Shortcuts
- **Enter**: Confirm dialogs and inputs
- **Mouse Click**: Play cards, draw, call UNO

### UI Elements
- **Lobby**: Create or join rooms
- **Room Screen**: Wait for players, host starts game
- **Game Screen**: 
  - Click playable cards to play
  - Click "Draw Card" when you cannot play
  - Click "UNO!" button when you have 2 cards
  - Choose colors for wild cards in modal

## Technical Details

### Architecture
- **Server**: Node.js with Express and Socket.IO
- **Client**: Vanilla JavaScript with HTML5/CSS3
- **Real-time Communication**: WebSocket (Socket.IO)
- **State Management**: Server-authoritative with client updates

### Security
- All game logic validated on server
- Client cannot modify game state
- Turn validation prevents cheating
- Rate limiting on socket events

### Performance
- Optimized for <100ms latency
- Efficient state synchronization
- Smooth animations using CSS transitions
- Mobile-responsive design

## Development

### Running in Development Mode
```bash
npm run dev
```

### File Structure
```
uno/
├── package.json          # Dependencies and scripts
├── server.js            # Socket.IO server and routing
├── game-logic.js        # UNO game engine and rules
├── index.html           # Main game interface
├── style.css            # CSS styling and animations
└── client.js            # Client-side JavaScript
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Test multiplayer functionality thoroughly
4. Submit a pull request

## Troubleshooting

### Connection Issues
- Ensure port 3000 is available
- Check firewall settings
- Verify all dependencies installed

### Game Bugs
- Refresh browser page
- Check browser console for errors
- Ensure all players have stable connection

### Performance
- Close unnecessary browser tabs
- Use modern browser (Chrome, Firefox, Safari)
- Check network latency if playing remotely

## License

MIT License - feel free to use, modify, and distribute.
# Deployment Platforms

## Render

1. Create account at [render.com](https://render.com)
2. Click 'New+' → 'Web Service'
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: PORT=3000
5. Deploy!

## Railway

1. Visit [railway.app](https://railway.app)
2. Click 'New Project' → 'Deploy from GitHub repo'
3. Select your repository
4. Add environment variable: PORT=3000
5. Deploy!

## Heroku

1. Install Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Create app: `heroku create`
4. Deploy: `git push heroku master`

## Replit

1. Visit [replit.com](https://replit.com)
2. Click 'Create Repl'
3. Choose Node.js template
4. Upload files or import from GitHub
5. Click 'Run'

