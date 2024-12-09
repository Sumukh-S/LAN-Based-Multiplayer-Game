const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const express = require('express');

const app = express();

// Secure server setup
const privateKey = fs.readFileSync('key.pem', 'utf8'); // SSL private key
const certificate = fs.readFileSync('cert.pem', 'utf8'); // SSL certificate
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);
const wss = new WebSocket.Server({ server: httpsServer });

const PORT = 3000;
const ALLOWED_IPS = ['192.168.242.192', '192.168.242.193']; // Example IPs
const PASSWORD = 'securePassword123'; // Set a password for authentication

// Serve static files
app.use(express.static('public'));

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;

    if (!ALLOWED_IPS.includes(clientIP)) {
        console.log(`Blocked connection attempt from ${clientIP}`);
        ws.close(); // Reject unauthorized connection
        return;
    }

    console.log(`Connection established from ${clientIP}`);

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
            }

            // Additional game logic goes here...
        } catch (err) {
            console.error('Error processing message:', err);
        }
    });
});

// Start the server
httpsServer.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
