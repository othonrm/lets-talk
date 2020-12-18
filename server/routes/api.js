const express = require('express');
const roomController = require('../app/controllers/RoomController');

const router = express.Router();

// rooms['sala-premium'] = { owner: 'othon', locked: true, users: [] };

roomController(router);

module.exports = router;
