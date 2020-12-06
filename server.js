const express = require("express");
// const favicon = require("express-favicon");
const path = require("path");
const app = express();
const port = process.env.PORT || 8080;
const { v4: uuidv4 } = require("uuid");

const server = require("http").Server(app);
const io = require("socket.io")(server, {
    cors: {
        origin:
            process.env.NODE_ENV !== "production"
                ? "*"
                : "https://othon-lets-talk.herokuapp.com",
    },
});
const { ExpressPeerServer } = require("peer");

const peerServer = ExpressPeerServer(server, {
    debug: true,
});

console.log(process.env.NODE_ENV);

app.use((req, res, next) => {
    const allowedOrigins =
        process.env.NODE_ENV !== "production"
            ? [
                  "http://127.0.0.1:3000",
                  "http://localhost:8080",
                  "http://127.0.0.1:8080",
                  "http://localhost:3000",
              ]
            : ["https://othon-lets-talk.herokuapp.com"];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", true);
    return next();
});

// app.use(favicon(__dirname + "/build/favicon.ico"));

app.use("/peerjs", peerServer);

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "build")));

app.get("/ping", function (req, res) {
    return res.send("pong");
});

// app.use(function (req, res, next) {
//     if (req.secure || process.env.NODE_ENV !== "production") {
//         // request was via https, so do no special handling
//         next();
//     } else {
//         // request was via http, so redirect to https
//         res.redirect("https://" + req.headers.host + req.url);
//     }
// });

app.get("/api/v1/rooms", function (req, res) {
    res.json(rooms);
});

app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

let rooms = {};

let allowed_users = {};

io.on("connection", (socket) => {
    socket.on("knock-room", (roomId, userName) => {
        console.log("user knocking: " + roomId + " - " + userName);

        if (!rooms[roomId] || rooms[roomId].locked !== true) {
            io.to(socket.id).emit("allowed-to-enter", true);
        } else {
            io.to(rooms[roomId].owner).emit(
                "knock-request",
                roomId,
                userName,
                socket.id
            );
        }
    });

    socket.on(
        "join-room",
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
                console.log("Pass not allowed: " + pass, allowed_users[roomId]);

                console.log(`User: ${userId}, Invade Room: ${roomId}`);

                io.to(socket.id).emit("invaded-not-allowed");

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

            console.log(`User: ${userId}, Joined Room: ${roomId}`);

            socket.join(roomId);

            socket
                .to(roomId)
                .broadcast.emit("user-connected", userId, userName);

            io.to(roomId).emit("room-members", rooms[roomId].users);

            if (rooms[roomId] && rooms[roomId].owner === socket.id) {
                io.to(roomId).emit("room-owner", socket.id);
            }

            socket.on("disconnect", () => {
                socket.to(roomId).broadcast.emit("user-disconnected", userId);

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
                            console.log(
                                `Owner diconecting set another onwer: ${roomId} ${rooms[roomId].users[0].socket}`
                            );
                            rooms[roomId].owner = rooms[roomId].users[0].socket;
                            io.to(roomId).emit(
                                "room-owner",
                                rooms[roomId].users[0].socket
                            );
                        }
                    }
                }

                rooms[roomId] &&
                    io.to(roomId).emit("room-members", rooms[roomId].users);

                // console.log(rooms);
            });

            socket.on("toggle-track", (track, enabled) => {
                console.log(
                    `User ${socket.id} has ${
                        enabled ? "enabled" : "disabled"
                    } ${track}`
                );

                rooms[roomId].users.find((user) => user.socket === socket.id)[
                    track
                ] = enabled;

                io.to(roomId).emit("room-members", rooms[roomId].users);
            });

            socket.on("lock-room", (roomId, lock = undefined) => {
                console.log(`Lock room request: ${roomId} ${lock}`);
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

                    console.log(`Lock request done`);
                } else if (rooms[roomId].owner !== socket.id) {
                    console.log(
                        `Clown trying to lock room: ${roomId} ${socket.id}`
                    );
                }
                io.to(roomId).emit("room-lock", rooms[roomId].locked);
            });

            socket.on("knock-response", (socketId) => {
                console.log(`Allowed to enter (socketId): ${socketId}`);

                let pass = uuidv4();

                io.to(socketId).emit("allowed-to-enter", true, pass);

                allowed_users[roomId] = [
                    ...(allowed_users[roomId] || []),
                    pass,
                ];
            });

            socket.on("message", (msg) => {
                console.log(`Received Message: ${msg} from room: ${roomId}`);
                io.to(roomId).emit("received-message", {
                    sender: socket.id,
                    date: new Date(),
                    content: msg,
                });
            });

            // if (rooms[roomId]) rooms[roomId].locked = true;

            // console.log(rooms);
        }
    );
});

server.listen(port);
