const express = require("express");
// const favicon = require("express-favicon");
const path = require("path");
const app = express();
const port = process.env.PORT || 8080;

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
    console.log(origin);
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

app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        console.log(`User: ${userId}, Joined Room: ${roomId}`);

        socket.join(roomId);

        socket.to(roomId).broadcast.emit("user-connected", userId);

        socket.on("disconnect", () => {
            socket.to(roomId).broadcast.emit("user-disconnected", userId);
        });

        socket.on("message", (msg) => {
            console.log(`Received Message: ${msg} from room: ${roomId}`);
            io.to(roomId).emit("received-message", msg);
        });
    });
});

server.listen(port);
