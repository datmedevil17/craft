import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Persistent rooms state
const rooms = {
    "Room 1": { players: {} },
    "Room 2": { players: {} },
    "Room 3": { players: {} }
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', ({ walletAddress, roomName, model }) => {
        if (!rooms[roomName]) {
            socket.emit('error', 'Room does not exist');
            return;
        }

        // Leave current rooms
        for (const r in rooms) {
            if (rooms[r].players[walletAddress]) {
                delete rooms[r].players[walletAddress];
                socket.leave(r);
            }
        }

        // Join new room
        socket.join(roomName);
        rooms[roomName].players[walletAddress] = {
            socketId: socket.id,
            walletAddress,
            model,
            position: [0, 0, 0],
            rotation: [0, 0, 0]
        };

        console.log(`${walletAddress} joined ${roomName}`);

        // Notify others in the room
        socket.to(roomName).emit('playerJoined', rooms[roomName].players[walletAddress]);

        // Send current players in room to the new player
        socket.emit('currentPlayers', rooms[roomName].players);
    });

    socket.on('updatePosition', ({ walletAddress, roomName, position, rotation }) => {
        if (rooms[roomName] && rooms[roomName].players[walletAddress]) {
            rooms[roomName].players[walletAddress].position = position;
            rooms[roomName].players[walletAddress].rotation = rotation;

            // Broadcast to others in the room
            socket.to(roomName).emit('playerMoved', { walletAddress, position, rotation });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Find and remove player from all rooms
        for (const roomName in rooms) {
            for (const walletAddress in rooms[roomName].players) {
                if (rooms[roomName].players[walletAddress].socketId === socket.id) {
                    console.log(`${walletAddress} left room ${roomName}`);
                    delete rooms[roomName].players[walletAddress];
                    io.to(roomName).emit('playerLeft', walletAddress);
                }
            }
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
    console.log('Available rooms:', Object.keys(rooms));
});
