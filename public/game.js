const ws = new WebSocket('https://192.168.56.1:3000/'); // Replace <YOUR_SERVER_IP> with your server's IP addressReplace <YOUR_SERVER_IP> with your server's IP address

let messagesMemory = [];

ws.onopen = () => {
    console.log('Connected to the server');
    // Send authentication message
    ws.send(JSON.stringify({ type: 'auth', password: 'securePassword123' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'auth') {
        if (data.status === 'success') {
            console.log('Authentication successful');
        } else {
            console.log('Authentication failed');
            ws.close();
        }
    } else if (data.type === 'update') {
        updateGame(data.gameState, data.scores, data.gamesPlayed, data.winner);
    } else if (data.type === 'chatMessage') {
        addChatMessage(data.message);
    } else if (data.type === 'clearMessages') {
        clearMessages();
    }
};

ws.onclose = () => {
    console.log('Disconnected from the server');
};

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        ws.send(JSON.stringify({ type: 'makeMove', index }));
    });
});

document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('restart-btn').addEventListener('click', restartGame);

function sendMessage() {
    const message = document.getElementById('chat-input').value;
    ws.send(JSON.stringify({ type: 'chatMessage', message }));
    document.getElementById('chat-input').value = '';
}

function updateGame(gameState, scores, gamesPlayed, winner) {
    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.textContent = gameState[index];
    });
    document.getElementById('scoreboard').textContent = `X: ${scores.X} | O: ${scores.O} | Games Played: ${gamesPlayed}`;
    if (winner) {
        showNotification(`${winner} wins!`);
        animateWinningCells();
    }
}

function addChatMessage(message) {
    const messages = document.getElementById('messages');
    const li = document.createElement('li');
    li.textContent = message;
    messages.appendChild(li);
    messagesMemory.push(message);
}

function clearMessages() {
    document.getElementById('messages').innerHTML = '';
    messagesMemory = [];
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function animateWinningCells() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.add('winning-cell');
    });
    setTimeout(() => {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('winning-cell');
        });
    }, 3000);
}

function restartGame() {
    ws.send(JSON.stringify({ type: 'restartGame' }));
    clearMessages();
}