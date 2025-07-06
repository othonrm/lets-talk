/* eslint-disable react/prop-types */
/* eslint-disable no-param-reassign */
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useParams } from 'react-router';

import {
    dummyAudioTrack,
    dummyVideoTrack,
    replaceSenderTrack,
    useForceUpdate,
} from '../helpers';

import enterRoomClip from '../assets/audios/enter_room.mp3';
import leaveRoomClip from '../assets/audios/leave_room.mp3';
import newMessageClip from '../assets/audios/new_message.mp3';

let socket;
let peer;

const connectSocketNPeer = callback => {
    socket = io(
        process.env.NODE_ENV === 'development' ? 'localhost:8080' : '/',
    );

    window.socket = socket;

    peer = new Peer(undefined, {
        path: '/peerjs',
        host: '/',
        secure: process.env.NODE_ENV !== 'development',
        port: process.env.NODE_ENV === 'development' ? 8080 : 443,
    });

    callback && callback();
};

function Connection({
    setConnectedUsers,
    currentUserStream,
    setCurrentUserStream,
    myId,
    setMyId,
}) {
    const { getUserMedia } = navigator.mediaDevices;
    // eslint-disable-next-line
    const roomId = useParams().room_id;

    const forceUpdate = useForceUpdate();

    window.forceUpdate = forceUpdate;

    /* eslint-disable operator-linebreak */
    const currentUserName =
        localStorage.getItem('user_name') !== null &&
        localStorage.getItem('user_name') !== undefined &&
        localStorage.getItem('user_name') !== ''
            ? localStorage.getItem('user_name')
            : 'Guest';
    /* eslint-enable operator-linebreak */

    const [startedMedia, setStartedMedia] = useState(undefined);
    const [connected, setConnected] = useState(socket && socket.connected);
    const [screenSharing, setScreenSharing] = useState(false);
    const [currentDisplayStream, setCurrentDisplayStream] = useState(undefined);
    const audioEnabled = localStorage.getItem('audio_enabled') !== 'false';
    const videoEnabled = localStorage.getItem('video_enabled') !== 'false';

    const audiooutput = localStorage.getItem('audiooutput_device');
    const audioEnterRoom = new Audio(enterRoomClip);
    const audioLeaveRoom = new Audio(leaveRoomClip);
    const audioNewMessage = new Audio(newMessageClip);

    audioEnterRoom.volume = 0.5;
    audioLeaveRoom.volume = 0.5;
    audioNewMessage.volume = 0.5;

    if (
        audiooutput !== undefined &&
        audiooutput !== null &&
        audiooutput !== ''
    ) {
        audioEnterRoom.setSinkId(audiooutput);
        audioLeaveRoom.setSinkId(audiooutput);

        audioNewMessage.setSinkId(audiooutput);
    }

    const connectToNewUser = (stream, userId, userName, myUserName) => {
        const call = peer.call(userId, stream, {
            metadata: { username: myUserName },
        });

        call.on('stream', () => {
            if (window.connectedUsers[userId]) return;

            setConnectedUsers({
                ...window.connectedUsers,
                [userId]: call,
            });

            // window.forceUpdate && window.forceUpdate();
        });

        call.on('close', () => {
            setConnectedUsers({
                ...window.connectedUsers,
                [call.peer]: undefined,
            });
        });
    };

    window.onChangeMediaDevices = () => {
        audioEnterRoom.setSinkId(audiooutput);
        audioLeaveRoom.setSinkId(audiooutput);
        // audioKnocking.setSinkId(audiooutput);
        audioNewMessage.setSinkId(audiooutput);
        window.refreshAudioOutputDevice();
    };

    const leaveRoom = () => {
        currentUserStream &&
            currentUserStream.getTracks().forEach(track => {
                track.enabled = false;
            });

        setTimeout(() => {
            currentUserStream &&
                currentUserStream.getTracks().forEach(track => {
                    track.stop();
                });
        }, 250);

        setTimeout(() => {
            peer && peer.removeAllListeners();
            socket && socket.removeAllListeners();

            peer && peer.destroy();
            socket && socket.disconnect();
            socket && socket.close();

            // eslint-disable-next-line
            window.location.replace(`/${roomId}/out`);
        }, 500);
    };

    window.leaveRoom = leaveRoom;

    const setSocketEvents = () => {
        socket.on('connect', () => {
            setConnected(socket.connected);
        });

        socket.on('disconnect', () => {
            leaveRoom();
        });

        socket.on('user-connected', (userId, userName) => {
            const checkMyStream = () => {
                if (!currentUserStream) {
                    setTimeout(checkMyStream, 100);
                } else {
                    connectToNewUser(
                        currentUserStream,
                        userId,
                        userName,
                        currentUserName,
                    );
                }
            };

            checkMyStream();
        });

        socket.on('user-disconnected', userId => {
            if (window.connectedUsers[userId]) {
                window.connectedUsers[userId].close();
            }
        });

        socket.on('room-not-found', () => {
            console.log('Room not found');
            window.location.replace(`/${roomId}/not-found`);
        });

        socket.on('invaded-not-allowed', () => {
            console.log('YOU SHALL NOT PASS');
            window.location.reload();
        });
    };

    const answerCall = (call, stream) => {
        window.answer_stream = stream;

        call.answer(stream);

        call.on('stream', () => {
            if (window.connectedUsers[call.peer]) return;

            setConnectedUsers({
                ...window.connectedUsers,
                [call.peer]: call,
            });
        });

        call.on('disconnected', () => {
            setConnectedUsers({
                ...window.connectedUsers,
                [call.peer]: undefined,
            });
        });

        call.on('close', () => {
            setConnectedUsers({
                ...window.connectedUsers,
                [call.peer]: undefined,
            });
        });
    };

    const setPeerEvents = () => {
        peer.on('open', peerId => {
            setMyId(peerId);

            socket.emit(
                'join-room',
                roomId,
                peerId,
                currentUserName,
                localStorage.getItem('locked_room_pass'),
                /* eslint-disable operator-linebreak */
                currentUserStream.getVideoTracks()[0]
                    ? currentUserStream.getVideoTracks()[0].enabled
                    : false,
                /* eslint-enable operator-linebreak */
                currentUserStream.getAudioTracks()[0].enabled,
            );
        });

        peer.on('call', call => {
            const checkMyStream = () => {
                if (!currentUserStream) {
                    setTimeout(checkMyStream, 100);
                } else {
                    answerCall(call, currentUserStream, myId);
                }
            };

            checkMyStream();
        });
    };

    const stopScreenShare = () => {
        const peerConnections = Object.values({
            ...window.connectedUsers,
        }).reduce((acc, curr) => {
            return [...acc, curr.peerConnection];
        }, []);

        setScreenSharing(false);
        setCurrentDisplayStream(undefined);

        if (currentUserStream.getVideoTracks()[1]) {
            currentUserStream.getVideoTracks()[1].enabled = false;
            currentUserStream.getVideoTracks()[1].stop();
        }

        socket.emit('toggle-track', 'screen', false);

        replaceSenderTrack(peerConnections, currentUserStream, 'screen');
    };

    window.stopScreenShare = stopScreenShare;

    const screenShare = () => {
        if (screenSharing) {
            stopScreenShare();

            return;
        }

        navigator.mediaDevices
            .getDisplayMedia({
                video: true,
                audio: false,
            })
            .then(displayStream => {
                const videoTrack = displayStream.getVideoTracks()[0];

                videoTrack.onended = () => {
                    videoTrack.enabled = false;
                    stopScreenShare(displayStream);
                };

                const peerConnections = Object.values({
                    ...window.connectedUsers,
                }).reduce((acc, curr) => {
                    return [...acc, curr.peerConnection];
                }, []);

                displayStream.addTrack(
                    currentUserStream.getVideoTracks().find(item => {
                        return item.kind === 'video';
                    }),
                );

                const newStream = new MediaStream([
                    currentUserStream.getAudioTracks()[0],
                    currentUserStream.getVideoTracks()[0],
                    displayStream.getVideoTracks()[0],
                ]);

                setCurrentUserStream(newStream);

                socket.emit('toggle-track', 'screen', true);

                setScreenSharing(true);

                replaceSenderTrack(peerConnections, newStream, 'screen');
            })
            .catch(reason => {
                return console.error('Cannot get display because: ', reason);
            });
    };

    window.screenShare = screenShare;

    const sendMessage = msg => {
        socket.emit('message', msg);
    };

    window.sendMessage = sendMessage;

    const setEvents = () => {
        setSocketEvents();
        setPeerEvents();
    };

    useEffect(() => {
        return () => {
            audioLeaveRoom.play();
        };

        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (currentUserStream && !connected) {
            audioEnterRoom.play();

            connectSocketNPeer(setEvents);
        }

        // eslint-disable-next-line
    }, [currentUserStream]);

    useEffect(() => {
        const audioinput =
            localStorage.getItem('audioinput_device') || undefined;
        const videoinput =
            localStorage.getItem('videoinput_device') || undefined;

        const constraints = {
            video: videoinput ? { deviceId: videoinput } : true, //! videoDisabled,
            audio: audioinput ? { deviceId: audioinput } : audioEnabled,
        };

        if (!startedMedia) {
            getUserMedia(constraints)
                .then(mediaStream => {
                    if (mediaStream.getAudioTracks()[0]) {
                        mediaStream.getAudioTracks()[0].enabled = audioEnabled;
                    } else {
                        const audioTrack = dummyAudioTrack();
                        audioTrack.stop();
                        mediaStream.addTrack(audioTrack);
                    }

                    if (mediaStream.getVideoTracks()[0]) {
                        mediaStream.getVideoTracks()[0].enabled = videoEnabled;
                    } else {
                        const videoTrack = dummyVideoTrack();

                        videoTrack.stop();
                        mediaStream.addTrack(videoTrack);
                    }

                    const screenTrack = dummyVideoTrack();
                    screenTrack.kind2 = 'screen';
                    screenTrack.stop();
                    mediaStream.addTrack(screenTrack);

                    setCurrentUserStream(mediaStream);
                })
                .catch(reason => {
                    return console.error('Cannot get video because: ', reason);
                });

            setStartedMedia(true);
        }

        // eslint-disable-next-line
    }, [startedMedia]);

    useEffect(() => {
        if ((screenSharing, currentDisplayStream)) {
            socket.removeAllListeners('user-connected');

            socket.on('user-connected', (userId, userName) => {
                if (screenSharing) {
                    connectToNewUser(
                        currentDisplayStream,
                        userId,
                        userName,
                        currentUserName,
                    );
                } else {
                    const checkMyStream = () => {
                        if (!currentUserStream) {
                            setTimeout(checkMyStream, 100);
                        } else {
                            connectToNewUser(
                                currentUserStream,
                                userId,
                                userName,
                                currentUserName,
                            );
                        }
                    };

                    checkMyStream();
                }
            });
        }

        // eslint-disable-next-line
    }, [screenSharing, currentDisplayStream]);

    return null;
}

export default Connection;
