/* eslint-disable operator-linebreak, indent */
const express = require('express');
const favicon = require('express-favicon');
const path = require('path');
const bodyParser = require('body-parser');
const { ExpressPeerServer } = require('peer');

require('dotenv').config();

const app = express();
require('express-ws')(app);

const server = require('http').Server(app);

const port = process.env.PORT || 8080;

const io = require('socket.io')(server, {
    cors: {
        origin:
            process.env.NODE_ENV !== 'production' ? '*' : process.env.APP_URL,
    },
});

const cronEvents = require('./server/app/crons');
const socketEvents = require('./server/app/sockets');

const api = require('./server/routes/api');
const web = require('./server/routes/web');

const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const allowedOrigins =
        process.env.NODE_ENV !== 'production'
            ? [
                  'http://127.0.0.1:3000',
                  'http://localhost:8080',
                  'http://127.0.0.1:8080',
                  'http://localhost:3000',
              ]
            : [process.env.APP_URL];
    const { origin } = req.headers;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL);
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    return next();
});

cronEvents(io);
socketEvents(io);

app.use(favicon(__dirname + '/public/favicon.png'));

app.use('/api/v1', api);

app.use('/', web);

app.use('/peerjs', peerServer);

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(port);
