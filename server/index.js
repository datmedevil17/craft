import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAYER_MAX_HP = 40;          // 20 hearts × 2 HP each
const PLAYER_ATTACK_DAMAGE = 6;    // 3 hearts per hit
const BOSS_ATTACK_DAMAGE = 4;      // 2 hearts per boss hit
const BOSS_ATTACK_RANGE = 20;
const BOSS_ATTACK_INTERVAL = 2000; // ms
const BOSS_RESPAWN_TIME = 30000;   // 30s
const PVP_ATTACK_RANGE = 5;
const ATTACK_COOLDOWN = 500;       // ms between attacks
const MAX_CHAT_HISTORY = 50;
const PLAYER_RESPAWN_TIME = 3000;

// ─── Boss Config per Room ─────────────────────────────────────────────────────
const BOSS_CONFIG = {
    "Room 1": { type: 'Giant', maxHp: 500, position: [25, 1, 25], damage: BOSS_ATTACK_DAMAGE },
    "Room 2": { type: 'Demon', maxHp: 500, position: [25, 1, 25], damage: BOSS_ATTACK_DAMAGE },
    "Room 3": { type: 'Yeti', maxHp: 500, position: [25, 1, 25], damage: BOSS_ATTACK_DAMAGE },
};

// ─── Room State ───────────────────────────────────────────────────────────────
function createBoss(roomName) {
    const cfg = BOSS_CONFIG[roomName];
    return {
        type: cfg.type,
        hp: cfg.maxHp,
        maxHp: cfg.maxHp,
        position: [...cfg.position],
        alive: true,
        damage: cfg.damage,
        lastAttackTime: 0,
        targetWallet: null
    };
}

const rooms = {};
for (const name of ["Room 1", "Room 2", "Room 3"]) {
    rooms[name] = {
        players: {},
        boss: createBoss(name),
        chatHistory: [],
        blocks: []   // synced blocks: { pos:[x,y,z], type, placedBy }
    };
}

// ─── Helper: distance between two [x,y,z] arrays ─────────────────────────────
function dist3(a, b) {
    const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ─── Helper: find room + wallet by socketId ───────────────────────────────────
function findPlayerBySocket(socketId) {
    for (const roomName in rooms) {
        for (const wallet in rooms[roomName].players) {
            if (rooms[roomName].players[wallet].socketId === socketId) {
                return { roomName, wallet, player: rooms[roomName].players[wallet] };
            }
        }
    }
    return null;
}

// ─── Boss AI Tick ─────────────────────────────────────────────────────────────
setInterval(() => {
    const now = Date.now();
    for (const roomName in rooms) {
        const room = rooms[roomName];
        const boss = room.boss;
        if (!boss.alive) continue;

        // Find nearest alive player
        let nearest = null, nearestDist = Infinity;
        for (const wallet in room.players) {
            const p = room.players[wallet];
            if (!p.alive) continue;
            const d = dist3(boss.position, p.position);
            if (d < nearestDist) { nearest = wallet; nearestDist = d; }
        }

        if (nearest && nearestDist < BOSS_ATTACK_RANGE && now - boss.lastAttackTime > BOSS_ATTACK_INTERVAL) {
            boss.lastAttackTime = now;
            boss.targetWallet = nearest;
            // Damage is now handled client-side (synced with attack animation)
            // Server just broadcasts the attack event for animation sync
            io.to(roomName).emit('boss_attack', { targetWallet: nearest, damage: boss.damage, bossPosition: boss.position });
        }
    }
}, 500); // Check every 500ms for responsive combat

// ─── Socket Handlers ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // ── Join Room ──────────────────────────────────────────────────────────
    socket.on('joinRoom', ({ walletAddress, roomName, model, username }) => {
        if (!rooms[roomName]) {
            socket.emit('error', 'Room does not exist');
            return;
        }

        // Leave previous rooms
        for (const r in rooms) {
            if (rooms[r].players[walletAddress]) {
                delete rooms[r].players[walletAddress];
                socket.leave(r);
                io.to(r).emit('playerLeft', walletAddress);
            }
        }

        // Join new room
        socket.join(roomName);
        rooms[roomName].players[walletAddress] = {
            socketId: socket.id,
            walletAddress,
            model,
            username: username || walletAddress.slice(0, 6),
            position: [0, 10, 40],
            rotation: [0, 0, 0],
            hp: PLAYER_MAX_HP,
            maxHp: PLAYER_MAX_HP,
            alive: true,
            lastAttackTime: 0
        };

        console.log(`${walletAddress} joined ${roomName}`);

        // Notify others
        socket.to(roomName).emit('playerJoined', rooms[roomName].players[walletAddress]);

        // Send current state to new player
        socket.emit('currentPlayers', rooms[roomName].players);
        socket.emit('boss_health', {
            type: rooms[roomName].boss.type,
            hp: rooms[roomName].boss.hp,
            maxHp: rooms[roomName].boss.maxHp,
            position: rooms[roomName].boss.position,
            alive: rooms[roomName].boss.alive
        });
        socket.emit('chat_history', rooms[roomName].chatHistory.slice(-MAX_CHAT_HISTORY));
        socket.emit('current_blocks', rooms[roomName].blocks);
    });

    // ── Position Update ────────────────────────────────────────────────────
    socket.on('updatePosition', ({ walletAddress, roomName, position, rotation }) => {
        if (rooms[roomName]?.players[walletAddress]) {
            rooms[roomName].players[walletAddress].position = position;
            rooms[roomName].players[walletAddress].rotation = rotation;
            socket.to(roomName).emit('playerMoved', { walletAddress, position, rotation });
        }
    });

    // ── Set Username ───────────────────────────────────────────────────────
    socket.on('set_username', ({ walletAddress, roomName, username }) => {
        if (rooms[roomName]?.players[walletAddress]) {
            rooms[roomName].players[walletAddress].username = username.slice(0, 16);
            io.to(roomName).emit('username_update', { walletAddress, username: username.slice(0, 16) });
        }
    });

    // ── Player Attack (PvP) ────────────────────────────────────────────────
    socket.on('player_attack', ({ attackerWallet, targetWallet, roomName }) => {
        const room = rooms[roomName];
        if (!room) return;
        const attacker = room.players[attackerWallet];
        const target = room.players[targetWallet];
        if (!attacker || !target || !attacker.alive || !target.alive) return;

        // Cooldown
        const now = Date.now();
        if (now - attacker.lastAttackTime < ATTACK_COOLDOWN) return;
        attacker.lastAttackTime = now;

        // Range check
        const d = dist3(attacker.position, target.position);
        if (d > PVP_ATTACK_RANGE) return;

        // Apply damage
        target.hp = Math.max(0, target.hp - PLAYER_ATTACK_DAMAGE);
        io.to(roomName).emit('health_update', { walletAddress: targetWallet, hp: target.hp, maxHp: target.maxHp });
        io.to(roomName).emit('player_hit', { attacker: attackerWallet, target: targetWallet, damage: PLAYER_ATTACK_DAMAGE });

        if (target.hp <= 0) {
            target.alive = false;
            io.to(roomName).emit('player_dead', { walletAddress: targetWallet, killedBy: attackerWallet });

            // Respawn
            setTimeout(() => {
                if (room.players[targetWallet]) {
                    room.players[targetWallet].hp = PLAYER_MAX_HP;
                    room.players[targetWallet].alive = true;
                    room.players[targetWallet].position = [0, 10, 40];
                    io.to(roomName).emit('player_respawn', {
                        walletAddress: targetWallet,
                        hp: PLAYER_MAX_HP,
                        position: [0, 10, 40]
                    });
                }
            }, PLAYER_RESPAWN_TIME);
        }
    });

    // ── Boss Attack (from player) ──────────────────────────────────────────
    socket.on('attack_boss', ({ walletAddress, roomName }) => {
        const room = rooms[roomName];
        if (!room) return;
        const player = room.players[walletAddress];
        const boss = room.boss;
        if (!player || !player.alive || !boss.alive) return;

        // Cooldown
        const now = Date.now();
        if (now - player.lastAttackTime < ATTACK_COOLDOWN) return;
        player.lastAttackTime = now;

        // Removed distance check: boss moves on client, checking against static server position causes hits to fail when wandering

        // Apply damage
        boss.hp = Math.max(0, boss.hp - PLAYER_ATTACK_DAMAGE);
        io.to(roomName).emit('boss_health', {
            type: boss.type,
            hp: boss.hp,
            maxHp: boss.maxHp,
            position: boss.position,
            alive: boss.hp > 0
        });

        if (boss.hp <= 0) {
            boss.alive = false;
            io.to(roomName).emit('boss_dead', { roomName, killedBy: walletAddress, bossType: boss.type });
            console.log(`Boss ${boss.type} defeated in ${roomName} by ${walletAddress}`);

            // Respawn boss after delay
            setTimeout(() => {
                rooms[roomName].boss = createBoss(roomName);
                io.to(roomName).emit('boss_health', {
                    type: rooms[roomName].boss.type,
                    hp: rooms[roomName].boss.maxHp,
                    maxHp: rooms[roomName].boss.maxHp,
                    position: rooms[roomName].boss.position,
                    alive: true
                });
                io.to(roomName).emit('chat_message', {
                    sender: '⚔️ System',
                    text: `The ${rooms[roomName].boss.type} has returned!`,
                    timestamp: Date.now(),
                    system: true
                });
            }, BOSS_RESPAWN_TIME);
        }
    });

    // ── Chat Message ───────────────────────────────────────────────────────
    socket.on('chat_message', ({ walletAddress, roomName, text }) => {
        const room = rooms[roomName];
        if (!room?.players[walletAddress]) return;
        const player = room.players[walletAddress];
        const msg = {
            sender: player.username,
            senderWallet: walletAddress,
            text: text.slice(0, 200), // limit length
            timestamp: Date.now(),
            system: false
        };
        room.chatHistory.push(msg);
        if (room.chatHistory.length > MAX_CHAT_HISTORY) room.chatHistory.shift();
        io.to(roomName).emit('chat_message', msg);
    });

    // ── Whisper Message ────────────────────────────────────────────────────
    socket.on('whisper_message', ({ walletAddress, roomName, targetWallet, text }) => {
        const room = rooms[roomName];
        if (!room?.players[walletAddress] || !room?.players[targetWallet]) return;

        const sender = room.players[walletAddress];
        const target = room.players[targetWallet];
        const msg = {
            sender: sender.username,
            senderWallet: walletAddress,
            targetWallet,
            text: text.slice(0, 200),
            timestamp: Date.now(),
            whisper: true
        };

        // Send only to sender and target
        io.to(target.socketId).emit('whisper_message', msg);
        io.to(sender.socketId).emit('whisper_message', msg);
    });

    // ── Block Placement ────────────────────────────────────────────────────
    socket.on('place_block', ({ walletAddress, roomName, position, type }) => {
        const room = rooms[roomName];
        if (!room?.players[walletAddress]) {
            console.log(`[BLOCK] Rejected place_block - player ${walletAddress} not in room ${roomName}`);
            return;
        }
        const block = { pos: position, type, placedBy: walletAddress };
        room.blocks.push(block);
        console.log(`[BLOCK] ${walletAddress} placed ${type} at [${position}] in ${roomName}. Broadcasting to ${Object.keys(room.players).length - 1} other players.`);
        socket.to(roomName).emit('block_placed', block);
    });

    // ── Block Removal ──────────────────────────────────────────────────────
    socket.on('remove_block', ({ walletAddress, roomName, position }) => {
        const room = rooms[roomName];
        if (!room?.players[walletAddress]) return;
        const [rx, ry, rz] = position;
        room.blocks = room.blocks.filter(b => {
            const [bx, by, bz] = b.pos;
            return bx !== rx || by !== ry || bz !== rz;
        });
        socket.to(roomName).emit('block_removed', { position });
    });

    // ── Player Action (animation sync: walking, attacking, idle) ──────────
    socket.on('player_action', ({ walletAddress, roomName, action }) => {
        if (rooms[roomName]?.players[walletAddress]) {
            socket.to(roomName).emit('player_action', { walletAddress, action });
        }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const roomName in rooms) {
            for (const walletAddress in rooms[roomName].players) {
                if (rooms[roomName].players[walletAddress].socketId === socket.id) {
                    const username = rooms[roomName].players[walletAddress].username;
                    console.log(`${walletAddress} left room ${roomName}`);
                    delete rooms[roomName].players[walletAddress];
                    io.to(roomName).emit('playerLeft', walletAddress);

                    // System message
                    const msg = {
                        sender: '📤 System',
                        text: `${username} left the game`,
                        timestamp: Date.now(),
                        system: true
                    };
                    rooms[roomName].chatHistory.push(msg);
                    io.to(roomName).emit('chat_message', msg);
                }
            }
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
    console.log('Available rooms:', Object.keys(rooms));
    console.log('Bosses:', Object.entries(BOSS_CONFIG).map(([r, c]) => `${r}: ${c.type}`).join(', '));
});
