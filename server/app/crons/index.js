const cron = require('node-cron');
const Room = require('../models/Room');

var { subMinutes } = require('date-fns');

module.exports = io => {
    cron.schedule('*/15 * * * *', async () => {
        const socketRooms = [...io.of('/').adapter.rooms].reduce(
            (acc, curr) => [...acc, curr[0]],
            [],
        );

        const emptyQuery = {
            $and: [
                { name: { $nin: socketRooms } },
                { updated_at: { $lt: subMinutes(Date.now(), 15) } },
            ],
        };

        const emptyCount = await Room.countDocuments(emptyQuery);

        if (emptyCount && emptyCount > 0) {
            console.log(`Cleaning empty rooms: ${emptyCount}`);

            await Room.deleteMany(emptyQuery);
        } else {
            console.log(`No empty rooms`);
        }
    });
};
