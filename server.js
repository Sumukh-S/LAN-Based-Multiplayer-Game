const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let gameState = Array(9).fill(null);
let currentPlayer = "X";
let scores = { X: 0, O: 0 };
let gamesPlayed = 0;

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    socket.emit("init", { gameState, scores, gamesPlayed });

    socket.on("makeMove", ({ index }) => {
        if (!gameState[index]) {
            gameState[index] = currentPlayer;
            const winner = checkWin();
            if (winner) {
                scores[currentPlayer]++;
                gamesPlayed++;
                io.emit("update", { gameState, scores, gamesPlayed, winner });
                gameState = Array(9).fill(null); // Reset board
                currentPlayer = "X";
            } else {
                currentPlayer = currentPlayer === "X" ? "O" : "X";
                io.emit("update", { gameState, scores, gamesPlayed });
            }
        }
    });

    socket.on("chatMessage", (message) => {
        io.emit("chatMessage", message);
    });
});

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

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
