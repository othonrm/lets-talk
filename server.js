const express = require('express');
const cors = require('cors');
const path = require('path');

const { ExpressPeerServer } = require('peer');
const { v4: uuidv4 } = require('uuid');
const routes = require('./server/routes');

const app = express();
const server = require('http').Server(app);

const port = process.env.PORT || 8080;

const io = require('socket.io')(server, {
    cors: {
        origin:
            process.env.NODE_ENV !== 'production'
                ? '*'
                : 'https://www.lets-talk.dev.br',
    },
});
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.use(cors());

app.use((req, res, next) => {
    const allowedOrigins =
        process.env.NODE_ENV !== 'production'
            ? [
                  'http://127.0.0.1:3000',
                  'http://localhost:8080',
                  'http://127.0.0.1:8080',
                  'http://localhost:3000',
              ]
            : ['https://www.lets-talk.dev.br'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    return next();
});

// app.use(favicon(__dirname + "/build/favicon.ico"));

app.use(routes);

app.use('/peerjs', peerServer);

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

global.rooms = {
    'sala-premium': { owner: 'othon', locked: true, users: [] },
};

let allowedUsers = {};

io.on('connection', (socket) => {
    socket.on('knock-room', (roomId, userName) => {
        if (!rooms[roomId] || rooms[roomId].locked !== true) {
            io.to(socket.id).emit('allowed-to-enter', true);
        } else {
            io.to(rooms[roomId].owner).emit(
                'knock-request',
                roomId,
                userName,
                socket.id
            );
        }
    });

    socket.on(
        'join-room',
        (roomId, userId, userName, pass, video = true, audio = true) => {
            rooms[roomId] = {
                ...(rooms[roomId] || {}),
                owner: rooms[roomId] ? rooms[roomId].owner : socket.id,
                locked: (rooms[roomId] && rooms[roomId].locked) || false,
                users: [
                    ...((rooms[roomId] && rooms[roomId].users) || []),
                    {
                        id: userId,
                        name: userName,
                        socket: socket.id,
                        video,
                        audio,
                    },
                ],
            };

            if (
                rooms[roomId].locked &&
                (!allowed_users[roomId] ||
                    !allowed_users[roomId].find((item) => item === pass))
            ) {
                io.to(socket.id).emit('invaded-not-allowed');

                return;
            } else if (
                rooms[roomId].locked &&
                allowed_users[roomId] &&
                allowed_users[roomId].find((item) => item === pass)
            ) {
                // allowed_users[roomId] = [
                //     ...allowed_users[roomId].filter((item) => item !== pass),
                // ];
            }

            socket.join(roomId);

            socket
                .to(roomId)
                .broadcast.emit('user-connected', userId, userName);

            io.to(roomId).emit('room-members', rooms[roomId].users);

            if (rooms[roomId] && rooms[roomId].owner === socket.id) {
                io.to(roomId).emit('room-owner', socket.id);
            }

            socket.on('disconnect', () => {
                socket.to(roomId).broadcast.emit('user-disconnected', userId);

                if (rooms[roomId]) {
                    rooms[roomId] = {
                        ...rooms[roomId],
                        users: [
                            ...(rooms[roomId].users || []).filter(
                                (item) => item.id !== userId
                            ),
                        ],
                    };

                    if (rooms[roomId].users.length === 0) {
                        delete rooms[roomId];
                    } else {
                        if (rooms[roomId].owner === socket.id) {
                            rooms[roomId].owner = rooms[roomId].users[0].socket;
                            io.to(roomId).emit(
                                'room-owner',
                                rooms[roomId].users[0].socket
                            );
                        }
                    }
                }

                rooms[roomId] &&
                    io.to(roomId).emit('room-members', rooms[roomId].users);
            });

            socket.on('toggle-track', (track, enabled) => {
                rooms[roomId].users.find((user) => user.socket === socket.id)[
                    track
                ] = enabled;

                io.to(roomId).emit('room-members', rooms[roomId].users);
            });

            socket.on('lock-room', (roomId, lock = undefined) => {
                if (
                    rooms[roomId] &&
                    (rooms[roomId].owner === undefined ||
                        rooms[roomId].owner === socket.id)
                ) {
                    if (!rooms[roomId].owner) rooms[roomId].owner = socket.id;

                    if (lock === undefined) {
                        rooms[roomId].locked = !rooms[roomId].locked;
                    } else {
                        rooms[roomId].locked = lock === true ? true : false;
                    }
                } else if (rooms[roomId].owner !== socket.id) {
                    console.log(
                        `Clown trying to lock room: ${roomId} ${socket.id}`
                    );
                }
                io.to(roomId).emit('room-lock', rooms[roomId].locked);
            });

            socket.on('knock-response', (socketId) => {
                let pass = uuidv4();

                io.to(socketId).emit('allowed-to-enter', true, pass);

                allowed_users[roomId] = [
                    ...(allowed_users[roomId] || []),
                    pass,
                ];
            });

            socket.on('message', (msg) => {
                io.to(roomId).emit('received-message', {
                    sender: socket.id,
                    date: new Date(),
                    content: msg,
                });
            });
        }
    );
});

server.listen(port);
