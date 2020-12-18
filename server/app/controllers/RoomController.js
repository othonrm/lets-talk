const express = require('express');

const { getAllRooms, getRoom, createRoom } = require('../providers/Room');

const router = express.Router();

router.get('/rooms', async (req, res) => {
    const allRooms = await getAllRooms();

    res.json(allRooms);
});

router.post('/rooms', async (req, res) => {
    const {
        body: { room_id },
    } = req;

    const exstingRoom = await getRoom(room_id);

    if (exstingRoom) {
        return res.status(404).json({
            error: {
                code: 404,
                message: 'Room already exist',
            },
        });
    }

    try {
        const newRoom = await createRoom({
            name: room_id,
            owner: undefined,
            locked: false,
            users: [],
        });

        return res.status(201).json({
            data: {
                newRoom,
                message: 'Room created',
            },
        });
    } catch (error) {
        return res.status(400).json({
            error: {
                code: 400,
                message: 'Something gone wrong on room creation...',
                ...error,
            },
        });
    }
});

router.get('/rooms/:room_id', async (req, res) => {
    const {
        params: { room_id },
    } = req;

    const room = await getRoom(room_id);

    if (room) {
        res.json({
            data: {
                message: 'Room found',
            },
        });
    } else {
        res.status(404).json({
            error: {
                code: 404,
                message: 'Room not found',
            },
        });
    }
});

module.exports = app => app.use(router);
