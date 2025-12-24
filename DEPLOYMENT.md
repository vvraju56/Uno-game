# Deployment Guide

**Important:** This UNO game uses Socket.IO for real-time multiplayer, which requires a persistent server connection. Vercel, Netlify, and other serverless platforms do NOT support Socket.IO.

## ✅ Recommended Platforms (Free Tier Available)

### 1. Render.com (Recommended)
```bash
# 1. Go to https://render.com
# 2. Click "New+" → "Web Service"
# 3. Connect your GitHub repo: vvraju56/Uno-game
# 4. Configure:
#    - Build Command: npm install
#    - Start Command: node server.js
#    - Instance Type: Free (or $7/month for faster)
# 5. Deploy!

# Your app will be live at: https://your-app.onrender.com
```

### 2. Railway.app
```bash
# 1. Go to https://railway.app
# 2. Click "New Project" → "Deploy from GitHub repo"
# 3. Select: vvraju56/Uno-game
# 4. Add environment variable: PORT=3000
# 5. Deploy!

# Railway gives $5 free credit monthly
# Your app will be at: https://your-app.up.railway.app
```

### 3. Fly.io
```bash
# 1. Install Fly CLI:
curl -L https://fly.io/install.sh | sh

# 2. Login:
fly auth login

# 3. Launch:
fly launch

# 4. Deploy:
fly deploy
```

### 4. Heroku
```bash
# 1. Install Heroku CLI:
npm install -g heroku

# 2. Login:
heroku login

# 3. Create app:
heroku create your-uno-game

# 4. Deploy:
git push heroku master

# 5. Open:
heroku open
```

### 5. Replit (Easiest - No Setup)
```bash
# 1. Go to https://replit.com
# 2. Click "Create Repl"
# 3. Choose "Node.js" template
# 4. Click "Import from GitHub"
# 5. Enter: vvraju56/Uno-game
# 6. Click "Run" button

# Your app will be at: https://your-repl.replit.co
```

### 6. Glitch
```
# 1. Go to https://glitch.com
# 2. Click "New Project"
# 3. Choose "Clone from Git"
# 4. Enter: https://github.com/vvraju56/Uno-game.git
# 5. Click "Show"

# Your app will be at: https://your-project.glitch.me
```

### 7. DigitalOcean App Platform
```bash
# 1. Go to https://cloud.digitalocean.com
# 2. Click "Apps" → "Create App"
# 3. Connect GitHub repo
# 4. Configure:
#    - Build Command: npm install
#    - Run Command: node server.js
#    - HTTP Port: 3000
# 5. Deploy!

# $5 free credit monthly
```

## ❌ Platforms That Don't Work

- **Vercel** - Serverless, no WebSocket support
- **Netlify** - Serverless, no WebSocket support
- **GitHub Pages** - Static only, no backend
- **Cloudflare Pages** - Static only

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Open http://localhost:3000
```

## Environment Variables

Optional environment variables:

```bash
PORT=3000              # Server port (default: 3000)
NODE_ENV=production    # Production mode
```

## Troubleshooting

### "Cannot GET /" Error
- Make sure you're deploying `server.js`, not just the frontend
- Check that the start command is: `node server.js`

### WebSocket Connection Failed
- Platform doesn't support WebSockets
- Switch to Render, Railway, or Heroku

### Port Already in Use
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

## Current Deployments

- **GitHub Repository**: https://github.com/vvraju56/Uno-game
- **Local**: http://localhost:3000

## Questions?

Open an issue on GitHub: https://github.com/vvraju56/Uno-game/issues
