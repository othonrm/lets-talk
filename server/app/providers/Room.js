const Room = require('../models/Room');

module.exports = {
    getAllRooms: async () => {
        const rooms = await Room.find().limit(100);

        const roomsCount = await Room.countDocuments({});

        return { rooms, count: roomsCount };
    },

    getRoom: async room_id => {
        const room = await Room.findOne({ name: room_id });

        return room;
    },

    createRoom: async params => {
        const newRoom = await Room.create(params);

        return newRoom;
    },

    updateRoom: async (name, params) => {
        const updatedRoom = await Room.findOneAndUpdate({ name }, params, {
            new: true,
        });

        return updatedRoom;
    },

    deleteRoom: async name => {
        await Room.findOneAndRemove({ name });

        return true;
    },
};
