const mongoose = require('../../database');

const RoomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        owner: String,
        locked: {
            type: Boolean,
            required: true,
        },
        members: {
            type: Array,
            // default: [],
            required: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
        updated_at: {
            type: Date,
        },
    },
    // { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

RoomSchema.pre('save', function(next) {
    this.updated_at = Date.now();

    next();
});

RoomSchema.pre('findOneAndUpdate', function(next) {
    this._update.updated_at = Date.now();

    next();
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
