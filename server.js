import https from 'https';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import express from 'express';

const app = express();

// Secure server setup
const privateKey = fs.readFileSync('key.pem', 'utf8'); // SSL private key
const certificate = fs.readFileSync('cert.pem', 'utf8'); // SSL certificate
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);
const wss = new WebSocketServer({ server: httpsServer });

const PORT = 3000;
const ALLOWED_IPS = ['<your ip address>','<your ip address>']; // Example IPs
const PASSWORD = 'securePassword123'; // Set a password for authentication

// Serve static files
app.use(express.static('public'));

// Game state
let gameState = Array(9).fill(null);
let currentPlayer = "X";
let scores = { X: 0, O: 0 };
let gamesPlayed = 0;
let messagesMemory = [];

function checkWin() {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of winningCombos) {
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return currentPlayer;
        }
    }
    return null;
}

function broadcastGameState() {
    const gameStateMessage = JSON.stringify({ type: 'update', gameState, scores, gamesPlayed });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(gameStateMessage);
        }
    });
}

function broadcastChatMessage(message) {
    const chatMessage = JSON.stringify({ type: 'chatMessage', message });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(chatMessage);
        }
    });
}

function broadcastClearMessages() {
    const clearMessage = JSON.stringify({ type: 'clearMessages' });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(clearMessage);
        }
    });
}

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;

    if (!ALLOWED_IPS.includes(clientIP)) {
        console.log(`Blocked connection attempt from ${clientIP}`);
        ws.close(); // Reject unauthorized connection
        return;
    }

    console.log(`Connection established from ${clientIP}`);

    // Send initial game state and chat messages
    ws.send(JSON.stringify({ type: 'update', gameState, scores, gamesPlayed }));
    messagesMemory.forEach(message => {
        ws.send(JSON.stringify({ type: 'chatMessage', message }));
    });

    // Simple authentication
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'auth') {
                if (data.password === PASSWORD) {
                    ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
                    console.log(`Authenticated user from ${clientIP}`);
                } else {
                    ws.send(JSON.stringify({ type: 'auth', status: 'failed' }));
                    ws.close();
                    console.log(`Authentication failed for ${clientIP}`);
                }
            } else if (data.type === 'makeMove') {
                const { index } = data;
                if (!gameState[index]) {
                    gameState[index] = currentPlayer;
                    const winner = checkWin();
                    if (winner) {
                        scores[currentPlayer]++;
                        gamesPlayed++;
                        broadcastGameState();
                        gameState = Array(9).fill(null); // Reset board
                        currentPlayer = "X";
                        messagesMemory = [];
                        broadcastClearMessages();
                    } else {
                        currentPlayer = currentPlayer === "X" ? "O" : "X";
                        broadcastGameState();
                    }
                }
            } else if (data.type === 'chatMessage') {
                messagesMemory.push(data.message);
                broadcastChatMessage(data.message);
            } else if (data.type === 'restartGame') {
                gameState = Array(9).fill(null);
                currentPlayer = "X";
                messagesMemory = [];
                broadcastGameState();
                broadcastClearMessages();
            }
        } catch (err) {
            console.error('Error processing message:', err);
        }
    });
});

// Start the server
httpsServer.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});