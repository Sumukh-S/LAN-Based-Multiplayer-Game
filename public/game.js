const socket = io();

const cells = document.querySelectorAll(".cell");
const scoreboard = document.getElementById("scoreboard");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const messages = document.getElementById("messages");

let playerSymbol = "X"; // Default player

cells.forEach(cell => {
    cell.addEventListener("click", () => {
        const index = cell.getAttribute("data-index");
        socket.emit("makeMove", { index });
    });
});

sendBtn.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit("chatMessage", message);
        chatInput.value = "";
    }
});

socket.on("init", ({ gameState, scores, gamesPlayed }) => {
    updateBoard(gameState);
    updateScore(scores, gamesPlayed);
});

socket.on("update", ({ gameState, scores, gamesPlayed, winner }) => {
    updateBoard(gameState);
    updateScore(scores, gamesPlayed);
    if (winner) alert(`${winner} wins this round!`);
});

socket.on("chatMessage", (message) => {
    const li = document.createElement("li");
    li.textContent = message;
    messages.appendChild(li);
});

function updateBoard(gameState) {
    cells.forEach((cell, index) => {
        cell.textContent = gameState[index];
        cell.classList.remove("winning-cell");
    });
}

function updateScore(scores, gamesPlayed) {
    scoreboard.textContent = `X: ${scores.X} | O: ${scores.O} | Games Played: ${gamesPlayed}`;
}
