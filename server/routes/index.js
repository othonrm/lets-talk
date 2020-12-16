const express = require('express');

const router = express.Router();

// Middle ware that is specific to this router
router.use((req, res, next) => {
    console.log('Time: ', Date.now());
    next();
});

// Define the home page route
router.get('/', (req, res) => {
    res.send('home page');
});

// Define the about route
router.get('/about', function (req, res) {
    res.send('About us');
});

router.get('/api/v1/rooms', (req, res) => {
    res.json(rooms);
});

module.exports = router;
