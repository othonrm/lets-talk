const { v4: uuidv4 } = require('uuid');
const { getRoom, updateRoom, deleteRoom } = require('../providers/Room');

module.exports = io => {
    io.on('connection', socket => {
        socket.on('knock-room', async (roomId, userName) => {
            const currentRoom = await getRoom(roomId);

            if (!currentRoom || currentRoom.locked !== true) {
                io.to(socket.id).emit('allowed-to-enter', true);
            } else {
                io.to(currentRoom.owner).emit(
                    'knock-request',
                    roomId,
                    userName,
                    socket.id,
                );
            }
        });

        socket.on(
            'join-room',
            async (
                roomId,
                userId,
                userName,
                pass,
                video = true,
                audio = true,
            ) => {
                let joinedRoom = await getRoom(roomId);

                if (!joinedRoom) {
                    io.to(socket.id).emit('room-not-found');

                    return;
                }

                // if (
                //     joinedRoom.locked &&
                //     (!allowedUsers[roomId] ||
                //         !allowedUsers[roomId].find(item => {
                //             return item === pass;
                //         }))
                // ) {
                //     io.to(socket.id).emit('invaded-not-allowed');

                //     return;
                // }

                // handle allowed user passes remove after entered - one way ticket
                // if (
                //     joinedRoom.locked &&
                //     allowedUsers[roomId] &&
                //     allowedUsers[roomId].find(item => {
                //         return item === pass;
                //     })
                // ) {
                //     allowedUsers[roomId] = [
                //         ...allowedUsers[roomId].filter((item) => item !== pass),
                //     ];
                // }

                socket.join(roomId);

                const socketRooms = [...io.of('/').adapter.rooms];

                const socketRoom =
                    socketRooms &&
                    socketRooms.find(item => {
                        item[1] = [...item[1]];
                        return item[0] === roomId;
                    });

                joinedRoom = await updateRoom(roomId, {
                    owner: joinedRoom
                        ? joinedRoom.owner || socket.id
                        : socket.id,
                    locked: (joinedRoom && joinedRoom.locked) || false,
                    members: [
                        ...(joinedRoom.members || []).filter(member =>
                            socketRoom[1].find(item => item === member.socket),
                        ),
                        {
                            id: userId,
                            name: userName,
                            socket: socket.id,
                            video,
                            audio,
                        },
                    ],
                });

                socket
                    .to(roomId)
                    .broadcast.emit('user-connected', userId, userName);

                await sendRoomMembers(roomId);

                if (
                    joinedRoom.owner === socket.id ||
                    !joinedRoom.members.find(
                        member => member.socket === joinedRoom.owner,
                    )
                ) {
                    await updateRoom(roomId, {
                        owner: socket.id,
                    });

                    io.to(roomId).emit('room-owner', socket.id);
                }

                socket.on('disconnect', async () => {
                    socket
                        .to(roomId)
                        .broadcast.emit('user-disconnected', userId);

                    let currentRoom = await getRoom(roomId);

                    if (currentRoom) {
                        currentRoom = await updateRoom(roomId, {
                            members: [
                                ...currentRoom.members.filter(item => {
                                    return item.id !== userId;
                                }),
                            ],
                        });

                        if (currentRoom.members.length === 0) {
                            waitToDeleteRoom(roomId);
                        } else if (currentRoom.owner === socket.id) {
                            currentRoom.owner = currentRoom.members[0].socket;
                            io.to(roomId).emit(
                                'room-owner',
                                currentRoom.members[0].socket,
                            );
                        }
                    }

                    await sendRoomMembers(roomId);
                });

                socket.on('toggle-track', async (track, enabled) => {
                    const currentRoom = await getRoom(roomId);

                    currentRoom.members.find(user => {
                        return user.socket === socket.id;
                    })[track] = enabled;

                    await updateRoom(roomId, {
                        members: [...currentRoom.members],
                    });

                    await sendRoomMembers(roomId);
                });

                socket.on('lock-room', async (lock = undefined) => {
                    const currentRoom = await getRoom(roomId);

                    if (
                        currentRoom &&
                        (currentRoom.owner === undefined ||
                            currentRoom.owner === socket.id)
                    ) {
                        if (!currentRoom.owner) currentRoom.owner = socket.id;

                        if (lock === undefined) {
                            currentRoom.locked = !currentRoom.locked;
                        } else {
                            currentRoom.locked = lock === true;
                        }
                    } else if (currentRoom.owner !== socket.id) {
                        console.log(
                            `Clown trying to lock room: ${roomId} ${socket.id}`,
                        );
                    }
                    io.to(roomId).emit('room-lock', currentRoom.locked);
                });

                socket.on('knock-response', socketId => {
                    const pass = uuidv4();

                    io.to(socketId).emit('allowed-to-enter', true, pass);

                    // allowedUsers[roomId] = [
                    //     ...(allowedUsers[roomId] || []),
                    //     pass,
                    // ];
                });

                socket.on('message', msg => {
                    io.to(roomId).emit('received-message', {
                        sender: socket.id,
                        date: new Date(),
                        content: msg,
                    });
                });
            },
        );
    });

    const sendRoomMembers = async roomId => {
        let currentRoom = await getRoom(roomId);

        const socketRooms = [...io.of('/').adapter.rooms];

        const socketRoom =
            socketRooms &&
            socketRooms.find(item => {
                item[1] = [...item[1]];
                return item[0] === roomId;
            });

        if (currentRoom) {
            let notFoundMembers =
                socketRoom &&
                currentRoom.members.filter(
                    member =>
                        !socketRoom[1].find(item => item === member.socket),
                ).length;

            if (notFoundMembers > 0) {
                console.log('removing not found users before send users');

                currentRoom = await updateRoom(roomId, {
                    members: [
                        currentRoom.members.filter(member =>
                            socketRoom[1].find(item => item === member.socket),
                        ),
                    ],
                });
            }

            io.to(roomId).emit('room-members', currentRoom.members);
        }
    };
};

const waitToDeleteRoom = async roomId => {
    const waitTime = 15 * 60 * 1000;

    await sleep(waitTime);

    const room = await getRoom(roomId);

    if (!room.members || room.members.length == 0) {
        await deleteRoom(roomId);
    }
};

const sleep = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};
