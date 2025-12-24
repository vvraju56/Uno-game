class UnoClient {
    constructor() {
        this.socket = io();
        this.playerId = null;
        this.hand = [];
        this.drawnCard = null;
        this.lastPlayedCards = new Map(); // Track last played card for each player
        
        this.initializeEventListeners();
        this.initializeSocketListeners();
    }

    initializeEventListeners() {
        // Lobby screen
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.showNameInput('create');
        });

        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.showNameInput('join');
        });

        document.getElementById('confirmNameBtn').addEventListener('click', () => {
            this.handleNameConfirm();
        });

        document.getElementById('cancelNameBtn').addEventListener('click', () => {
            this.hideNameInput();
        });

        document.getElementById('confirmJoinBtn').addEventListener('click', () => {
            this.handleJoinRoom();
        });

        document.getElementById('cancelJoinBtn').addEventListener('click', () => {
            this.hideJoinRoomInput();
        });

        // Room screen
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.socket.emit('start_game');
        });

        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Game screen
        document.getElementById('drawCardBtn').addEventListener('click', () => {
            this.drawCard();
        });

        document.getElementById('unoBtn').addEventListener('click', () => {
            this.callUno();
        });

        // Color picker
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.playWildCard(color);
            });
        });

        // Game over
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.returnToLobby();
        });

        // Enter key support
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleNameConfirm();
        });

        document.getElementById('roomCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoinRoom();
        });
    }

    initializeSocketListeners() {
        this.socket.on('connect', () => {
            this.playerId = this.socket.id;
            console.log('Connected to server:', this.playerId);
        });

        this.socket.on('room_created', (data) => {
            this.roomId = data.roomId;
            this.isHost = true;
            this.showRoomScreen();
        });

        this.socket.on('room_joined', (data) => {
            this.roomId = data.roomId;
            this.isHost = false;
            this.showRoomScreen();
        });

        this.socket.on('room_update', (gameState) => {
            this.gameState = gameState;
            this.updateRoomScreen();
        });

        this.socket.on('player_joined', (data) => {
            this.showNotification(`${data.name} joined the room`);
        });

        this.socket.on('player_left', (data) => {
            this.showNotification('A player left the room');
            if (this.gameState) {
                this.gameState = data.gameState;
                this.updateRoomScreen();
            }
        });

        this.socket.on('game_started', (data) => {
            this.hand = data.hand;
            this.gameState = data.gameState;
            this.showGameScreen();
            this.updateGameBoard();
            this.updatePlayerHand();
        });

        this.socket.on('hand_update', (data) => {
            this.hand = data.hand;
            this.gameState = data.gameState;
            this.updatePlayerHand();
            this.updateGameBoard();
        });

        this.socket.on('card_played', (data) => {
            this.gameState = data.gameState;
            this.isMyTurn = this.gameState.players[this.gameState.currentPlayerIndex].id === this.playerId;
            
            const player = this.gameState.players.find(p => p.id === data.playerId);
            if (player && data.card) {
                this.updateLastPlayedCards(data.card, player.name);
            }
            
            this.updateGameBoard();
            this.updateTurnIndicator();
            
            if (data.gameState.skipEffect) {
                this.showSkipEffect(data.gameState.skipEffect);
            }
            if (data.gameState.reverseEffect) {
                this.showReverseEffect();
            }
            if (data.gameState.drawEffect) {
                this.showDrawEffect(data.gameState.drawEffect);
            }
            if (data.gameState.wildEffect) {
                this.showWildEffect(data.gameState.wildEffect);
            }
            
            if (data.gameState.swapEffect) {
                this.showSwapEffect(data.gameState.swapEffect);
            }
            if (data.gameState.shuffleEffect) {
                this.showShuffleEffect(data.gameState.shuffleEffect);
            }
            
            if (data.effect) {
                this.showEffect(data.effect);
            }
        });

        this.socket.on('turn_update', (data) => {
            this.gameState = data.gameState;
            this.isMyTurn = this.gameState.players[this.gameState.currentPlayerIndex].id === this.playerId;
            this.updateGameBoard();
            this.updateTurnIndicator();
        });

        this.socket.on('card_drawn', (data) => {
            this.hand = data.hand;
            this.gameState = data.gameState;
            this.drawnCard = data.card;
            this.updatePlayerHand();
            this.updateGameBoard();
            
            if (data.canPlayDrawnCard) {
                this.enableDrawnCardPlay();
            } else {
                this.isMyTurn = false;
            }
        });

        this.socket.on('can_play_drawn_card', (canPlay) => {
            if (canPlay) {
                this.enableDrawnCardPlay();
            } else {
                this.isMyTurn = false;
            }
        });

        this.socket.on('uno_called', (data) => {
            const player = this.gameState.players.find(p => p.id === data.playerId);
            this.showNotification(`${player.name} called UNO!`);
        });

        this.socket.on('uno_challenge', (data) => {
            const challenger = this.gameState.players.find(p => p.id === data.challengerId);
            const target = this.gameState.players.find(p => p.id === data.targetId);
            
            if (data.success) {
                this.showNotification(`${challenger.name} successfully challenged ${target.name}! ${target.name} draws ${data.penaltyCards} cards.`);
            } else {
                this.showNotification(`${challenger.name}'s challenge failed! ${challenger.name} draws ${data.penaltyCards} cards.`);
            }
        });

        this.socket.on('game_over', (data) => {
            this.showGameOver(data.winner);
        });

        this.socket.on('error_message', (message) => {
            this.showError(message);
        });

        this.socket.on('wild4_challenge_available', (data) => {
            if (data.challengeableBy === this.playerId) {
                this.showChallengeDialog(data.playerId);
            }
        });

        this.socket.on('wild4_challenge_result', (data) => {
            if (data.success) {
                this.showNotification(`${data.offender} played Wild Draw Four illegally! They draw 4 cards.`);
            } else {
                this.showNotification(`${data.challenger} challenged incorrectly! They draw 6 cards.`);
            }
        });
    }

    // UI Navigation Methods
    showNameInput(action) {
        document.getElementById('nameInput').style.display = 'block';
        document.getElementById('playerName').focus();
        document.getElementById('confirmNameBtn').dataset.action = action;
    }

    hideNameInput() {
        document.getElementById('nameInput').style.display = 'none';
        document.getElementById('playerName').value = '';
    }

    showJoinRoomInput() {
        document.getElementById('joinRoomInput').style.display = 'block';
        document.getElementById('roomCode').focus();
    }

    hideJoinRoomInput() {
        document.getElementById('joinRoomInput').style.display = 'none';
        document.getElementById('roomCode').value = '';
    }

    handleNameConfirm() {
        const name = document.getElementById('playerName').value.trim();
        if (!name) {
            this.showError('Please enter your name');
            return;
        }

        this.playerName = name;
        const action = document.getElementById('confirmNameBtn').dataset.action;

        if (action === 'create') {
            this.socket.emit('create_room', { name });
        } else {
            this.hideNameInput();
            this.showJoinRoomInput();
        }
    }

    handleJoinRoom() {
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        if (!roomCode) {
            this.showError('Please enter a room code');
            return;
        }

        this.socket.emit('join_room', { roomId: roomCode, name: this.playerName });
        this.hideJoinRoomInput();
    }

    showRoomScreen() {
        document.getElementById('lobbyScreen').style.display = 'none';
        document.getElementById('roomScreen').style.display = 'flex';
        document.getElementById('roomId').textContent = this.roomId;
        
        if (this.isHost) {
            document.getElementById('startGameBtn').style.display = 'block';
        }
    }

    updateRoomScreen() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';

        this.gameState.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            if (index === 0) {
                playerDiv.className += ' player-host';
            }
            
            playerDiv.innerHTML = `
                <span>${player.name}</span>
                <span>${index === 0 ? 'Host' : 'Player'} ${player.connected ? '🟢' : '🔴'}</span>
            `;
            playersList.appendChild(playerDiv);
        });

        // Show/hide waiting message
        const waitingMessage = document.getElementById('waitingMessage');
        if (this.gameState.players.length >= 2) {
            waitingMessage.style.display = 'none';
        } else {
            waitingMessage.style.display = 'block';
        }
    }

    leaveRoom() {
        this.socket.disconnect();
        this.socket.connect();
        this.returnToLobby();
    }

    returnToLobby() {
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('roomScreen').style.display = 'none';
        document.getElementById('lobbyScreen').style.display = 'flex';
        document.getElementById('gameOverModal').style.display = 'none';
        
        this.roomId = null;
        this.isHost = false;
        this.gameState = null;
        this.hand = [];
        this.isMyTurn = false;
        this.drawnCard = null;
    }

    showGameScreen() {
        document.getElementById('roomScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'flex';
    }

    // Game UI Methods
    updateGameBoard() {
        // Update deck count
        document.getElementById('deckCount').textContent = this.gameState.deckCount;

        // Update current color with better display
        const colorDiv = document.getElementById('currentColor');
        const currentColor = this.gameState.currentColor || this.gameState.discardTop?.color || 'red';
        
        // Set the background color directly for better visibility
        if (currentColor) {
            const colorMap = {
                'red': '#f44336',
                'blue': '#2196f3', 
                'green': '#4caf50',
                'yellow': '#ffeb3b',
                'wild': '#2c2c2c'
            };
            
            colorDiv.style.backgroundColor = colorMap[currentColor] || '#888888';
            colorDiv.style.border = `3px solid ${colorMap[currentColor] || '#888888'}`;
            colorDiv.style.boxShadow = `0 0 15px ${colorMap[currentColor] || '#888888'}`;
            colorDiv.textContent = currentColor.toUpperCase();
            colorDiv.style.color = 'white';
            colorDiv.style.fontWeight = 'bold';
            colorDiv.style.fontSize = '12px';
            colorDiv.style.display = 'flex';
            colorDiv.style.alignItems = 'center';
            colorDiv.style.justifyContent = 'center';
        } else {
            colorDiv.style.backgroundColor = '#666666';
            colorDiv.style.border = '3px solid #666666';
            colorDiv.textContent = '';
        }

        // Update turn indicator
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        document.getElementById('currentTurn').textContent = currentPlayer.name;

        // Update opponents
        this.updateOpponents();

        // Update draw button - always available but with different states
        const drawBtn = document.getElementById('drawCardBtn');
        if (this.isMyTurn) {
            drawBtn.disabled = false;
            drawBtn.textContent = 'Draw Card';
            drawBtn.classList.remove('disabled');
        } else {
            drawBtn.disabled = true;
            drawBtn.textContent = 'Wait Your Turn';
            drawBtn.classList.add('disabled');
        }

        // Update matching indicators
        this.displayLastPlayedCards();

        // Update UNO button
        const unoBtn = document.getElementById('unoBtn');
        if (this.hand.length === 2 && this.isMyTurn) {
            unoBtn.style.display = 'block';
        } else {
            unoBtn.style.display = 'none';
        }
    }

    updateOpponents() {
        const opponentsDiv = document.getElementById('opponents');
        opponentsDiv.innerHTML = '';

        this.gameState.players.forEach((player, index) => {
            if (player.id !== this.playerId) {
                const opponentDiv = document.createElement('div');
                opponentDiv.className = 'opponent';
                
                if (index === this.gameState.currentPlayerIndex) {
                    opponentDiv.className += ' current-turn';
                }

                opponentDiv.innerHTML = `
                    <div>${player.name}</div>
                    <div>Cards: ${player.handCount}</div>
                `;
                opponentsDiv.appendChild(opponentDiv);
            }
        });
    }

    updatePlayerHand() {
        const handDiv = document.getElementById('playerHand');
        handDiv.innerHTML = '';

        this.hand.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${card.color}`;
            cardDiv.textContent = this.getCardDisplay(card);
            cardDiv.dataset.cardId = card.id;
            
            // Mark power cards
            if (['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(card.value)) {
                cardDiv.className += ' power-card';
            }
            
            if (this.isMyTurn) {
                if (this.canPlayCard(card)) {
                    cardDiv.className += ' playable';
                }
                
                // Add matching indicator and hover information
                const matchingIndicator = document.createElement('div');
                matchingIndicator.className = 'hand-matching-indicator';
                matchingIndicator.textContent = this.canPlayCard(card) ? '✓' : '✗';
                matchingIndicator.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: ${this.canPlayCard(card) ? '#28a745' : '#dc3545'};
                    color: white;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 10;
                `;
                
                // Add hover tooltip with matching details
                const tooltip = document.createElement('div');
                tooltip.className = 'card-matching-tooltip';
                const topCard = this.gameState?.discardTop;
                const currentColor = this.gameState?.currentColor;
                
                let matchReasons = [];
                if (card.color === currentColor) matchReasons.push('Color Match');
                if (topCard && card.value === topCard.value) matchReasons.push('Value Match');
                if (card.color === 'wild') matchReasons.push('Wild Card');
                
                tooltip.innerHTML = `
                    <strong>${this.getCardDisplay(card)}</strong><br>
                    ${matchReasons.length > 0 ? 
                        '<span style="color: #28a745;">✓ ' + matchReasons.join(', ') + '</span>' : 
                        '<span style="color: #dc3545;">✗ No Match</span>'}<br>
                    <small>Current: ${currentColor || 'None'}</small>
                `;
                
                cardDiv.appendChild(matchingIndicator);
                cardDiv.appendChild(tooltip);
            }

            cardDiv.addEventListener('click', () => {
                if (this.isMyTurn && this.canPlayCard(card)) {
                    this.playCard(card);
                }
            });

            handDiv.appendChild(cardDiv);
        });
    }

    updateDiscardPile(card, chosenColor = null) {
        const discardDiv = document.getElementById('discardCard');
        discardDiv.className = `card ${card.color}`;
        discardDiv.textContent = this.getCardDisplay(card);
        
        // If a wild card was played and color was chosen, show it
        if (chosenColor && card.color === 'wild') {
            discardDiv.style.border = `5px solid ${chosenColor}`;
        }
    }

    updateTurnIndicator() {
        if (this.isMyTurn) {
            this.showNotification("It's your turn!");
        }
    }

    getCardDisplay(card) {
        const displayMap = {
            'skip': '⊘',
            'reverse': '⟲',
            'draw2': '+2',
            'wild': 'W',
            'wild4': '+4'
        };
        return displayMap[card.value] || card.value;
    }

    isPowerCard(card) {
        return ['skip', 'reverse', 'draw2', 'wild', 'wild4'].includes(card.value);
    }

    canPlayCard(card) {
        if (!this.gameState) return false;
        const topCard = this.gameState.discardTop;
        return card.color === this.gameState.currentColor ||
               card.value === topCard.value ||
               card.color === 'wild';
    }

    playCard(card) {
        if (card.color === 'wild') {
            // Show color picker
            document.getElementById('colorPicker').style.display = 'flex';
            this.pendingCard = card;
        } else {
            this.socket.emit('play_card', { cardId: card.id });
        }
    }

    playWildCard(color) {
        if (this.pendingCard) {
            this.socket.emit('play_card', { 
                cardId: this.pendingCard.id, 
                chosenColor: color 
            });
            document.getElementById('colorPicker').style.display = 'none';
            this.pendingCard = null;
        }
    }

    enableDrawnCardPlay() {
        const handDiv = document.getElementById('playerHand');
        const cards = handDiv.querySelectorAll('.card');
        
        cards.forEach(cardDiv => {
            if (this.drawnCard && cardDiv.dataset.cardId === this.drawnCard.id) {
                cardDiv.className += ' playable';
            }
        });
    }

    drawCard() {
        this.socket.emit('draw_card');
    }

    callUno() {
        this.socket.emit('call_uno');
    }

    updateLastPlayedCards(playedCard, playerName) {
        // Store last played card for this player
        this.lastPlayedCards.set(playerName, playedCard);
        
        // Update display
        this.displayLastPlayedCards();
    }

    displayLastPlayedCards() {
        const container = document.getElementById('lastPlayedCards');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.lastPlayedCards.size === 0) {
            container.innerHTML = '<p style="color: #999; font-size: 14px;">No cards played yet</p>';
            return;
        }
        
        this.lastPlayedCards.forEach((card, playerName) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'last-played-item';
            playerDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                margin-bottom: 8px;
            `;
            
            const nameSpan = document.createElement('span');
            nameSpan.style.cssText = `
                font-weight: bold;
                color: white;
                min-width: 80px;
                font-size: 14px;
            `;
            nameSpan.textContent = playerName;
            
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${card.color}`;
            cardDiv.style.cssText = `
                width: 50px;
                height: 70px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                font-weight: bold;
                font-size: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            cardDiv.textContent = this.getCardDisplay(card);
            
            playerDiv.appendChild(nameSpan);
            playerDiv.appendChild(cardDiv);
            container.appendChild(playerDiv);
        });
    }

    showCardPlayed(card, effect = null) {
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        const playerName = currentPlayer.name;
        
        // Update last played cards
        this.updateLastPlayedCards(card, playerName);
        
        let message = `${playerName} played ${this.getCardDisplay(card)}`;
        if (effect) {
            message += ` - ${effect}`;
        }
        this.showNotification(message);
    }

    showGameOver(winner) {
        const modal = document.getElementById('gameOverModal');
        const message = document.getElementById('winnerMessage');
        
        if (winner.id === this.playerId) {
            message.textContent = '🎉 Congratulations! You won! 🎉';
        } else {
            message.textContent = `${winner.name} won the game!`;
        }
        
        modal.style.display = 'flex';
    }
    
    showSkipEffect(skipData) {
        const notification = document.createElement('div');
        notification.className = 'effect-notification skip-effect';
        notification.textContent = `${skipData.playerName} was SKIPPED!`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: skipAnimation 2s ease-out forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
    
    showReverseEffect() {
        const notification = document.createElement('div');
        notification.className = 'effect-notification reverse-effect';
        notification.textContent = 'DIRECTION REVERSED!';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: reverseAnimation 1.5s ease-in-out forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1500);
    }
    
    showDrawEffect(drawData) {
        const notification = document.createElement('div');
        notification.className = 'effect-notification draw-cards-effect';
        notification.textContent = `${drawData.playerName} draws ${drawData.count} cards!`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: drawCardsAnimation 1.2s ease-out forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1200);
    }
    
    showWildEffect(wildData) {
        const notification = document.createElement('div');
        notification.className = 'effect-notification wild-effect';
        notification.textContent = wildData.colorChosen ? 'WILD CARD PLAYED!' : 'COLOR CHANGED!';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #fa709a, #fee140, #30cfd0, #764ba2);
            background-size: 400% 400%;
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: wildCardEffect 2s ease-in-out forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    showNotification(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.background = '#4caf50';
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.background = '#f44336';
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showChallengeDialog(offenderId) {
        const modal = document.createElement('div');
        modal.className = 'challenge-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
        `;
        
        content.innerHTML = `
            <h3 style="color: #f44336; margin-bottom: 15px;">Wild Draw Four Challenge!</h3>
            <p style="margin-bottom: 20px;">Someone played Wild Draw Four on you! Do you want to challenge?</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                If they had a matching color card, they draw 4.<br>
                If they didn't, YOU draw 6!
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="challengeBtn" style="background: #f44336; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Challenge!</button>
                <button id="declineBtn" style="background: #4caf50; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Decline</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        const timeout = setTimeout(() => {
            modal.remove();
        }, 10000);
        
        document.getElementById('challengeBtn').addEventListener('click', () => {
            clearTimeout(timeout);
            this.socket.emit('challenge_wild4');
            modal.remove();
        });
        
        document.getElementById('declineBtn').addEventListener('click', () => {
            clearTimeout(timeout);
            modal.remove();
        });
    }

    showSwapEffect(swapData) {
        const notification = document.createElement('div');
        notification.className = 'effect-notification swap-effect';
        notification.textContent = `${swapData.fromPlayer} swapped hands with ${swapData.toPlayer}!`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff9a9e, #fecfef);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 20px;
            font-weight: bold;
            z-index: 10000;
            animation: swapAnimation 2s ease-out forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    showShuffleEffect(shuffleData) {
        const notification = document.createElement('div');
        notification.className = 'effect-notification shuffle-effect';
        notification.textContent = 'ALL HANDS SHUFFLED AND REDEALT!';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #a18cd1, #fbc2eb);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 20px;
            font-weight: bold;
            z-index: 10000;
            animation: shuffleAnimation 2.5s ease-out forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2500);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new UnoClient();
});