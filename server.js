const express = require("express");
// const favicon = require("express-favicon");
const path = require("path");
const app = express();
const cors = require("cors");
const server = require("http").Server(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
    },
});
const { ExpressPeerServer } = require("peer");

const port = process.env.PORT || 8080;

const peerServer = ExpressPeerServer(server, {
    debug: true,
});

var corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// app.use(favicon(__dirname + "/build/favicon.ico"));

app.use("/peerjs", peerServer);

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "build")));

app.get("/ping", function (req, res) {
    return res.send("pong");
});
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
