import { useEffect, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import { useParams } from "react-router";

import {
    dummyAudioTrack,
    dummyVideoTrack,
    replaceSenderTrack,
    useForceUpdate,
} from "../helpers";

import enter_room from "../assets/audios/enter_room.mp3";
import leave_room from "../assets/audios/leave_room.mp3";

import new_message from "../assets/audios/new_message.mp3";

let socket;
let peer;

const connectSocketNPeer = (callback) => {
    socket = io(
        process.env.NODE_ENV === "development" ? "localhost:8080" : "/"
    );

    window.socket = socket;

    peer = new Peer(undefined, {
        path: "/peerjs",
        host: "/",
        secure: process.env.NODE_ENV === "development" ? false : true,
        port: process.env.NODE_ENV === "development" ? 8080 : 443,
    });

    callback && callback();
};

function Connection({
    setConnectedUsers,
    currentUserStream,
    setCurrentUserStream,
    handleLeaveRoom,
    myId,
    setMyId,

    ...props
}) {
    const { getUserMedia } = navigator.mediaDevices;
    const { room_id } = useParams();

    const forceUpdate = useForceUpdate();

    window.forceUpdate = forceUpdate;

    const currentUserName =
        localStorage.getItem("user_name") !== null &&
        localStorage.getItem("user_name") !== undefined &&
        localStorage.getItem("user_name") !== ""
            ? localStorage.getItem("user_name")
            : "Guest";

    const [startedMedia, setStartedMedia] = useState(undefined);
    const [connected, setConnected] = useState(socket && socket.connected);
    const [screenSharing, setScreenSharing] = useState(false);
    const [currentDisplayStream, setCurrentDisplayStream] = useState(undefined);
    const audioEnabled = localStorage.getItem("audio_enabled") !== "false";
    const videoEnabled = localStorage.getItem("video_enabled") !== "false";

    const audiooutput = localStorage.getItem("audiooutput_device");
    const audioEnterRoom = new Audio(enter_room);
    const audioLeaveRoom = new Audio(leave_room);

    const audioNewMessage = new Audio(new_message);
    audioEnterRoom.volume = 0.5;
    audioLeaveRoom.volume = 0.5;

    audioNewMessage.volume = 0.5;
    if (
        audiooutput !== undefined &&
        audiooutput !== null &&
        audiooutput !== ""
    ) {
        audioEnterRoom.setSinkId(audiooutput);
        audioLeaveRoom.setSinkId(audiooutput);

        audioNewMessage.setSinkId(audiooutput);
    }

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
        let audioinput = localStorage.getItem("audioinput_device") || undefined;
        let videoinput = localStorage.getItem("videoinput_device") || undefined;

        let constraints = {
            video: videoinput ? { deviceId: videoinput } : true, //!videoDisabled,
            audio: audioinput ? { deviceId: audioinput } : audioEnabled,
        };

        if (!startedMedia) {
            getUserMedia(constraints)
                .then((media_stream) => {
                    if (media_stream.getAudioTracks()[0]) {
                        media_stream.getAudioTracks()[0].enabled = audioEnabled;
                    } else {
                        let audioTrack = dummyAudioTrack();
                        audioTrack.stop();
                        media_stream.addTrack(audioTrack);
                    }

                    if (media_stream.getVideoTracks()[0]) {
                        media_stream.getVideoTracks()[0].enabled = videoEnabled;
                    } else {
                        let videoTrack = dummyVideoTrack();

                        videoTrack.stop();
                        media_stream.addTrack(videoTrack);
                    }

                    let screenTrack = dummyVideoTrack();
                    screenTrack.kind2 = "screen";
                    screenTrack.stop();
                    media_stream.addTrack(screenTrack);

                    setCurrentUserStream(media_stream);
                })
                .catch((reason) =>
                    console.error("Cannot get video because: ", reason)
                );

            setStartedMedia(true);
        }

        // eslint-disable-next-line
    }, [startedMedia]);

    useEffect(() => {
        if ((screenSharing, currentDisplayStream)) {
            socket.removeAllListeners("user-connected");

            socket.on("user-connected", (userId, userName) => {
                if (screenSharing) {
                    connectToNewUser(
                        currentDisplayStream,
                        userId,
                        userName,
                        currentUserName
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
                                currentUserName
                            );
                        }
                    };

                    checkMyStream();
                }
            });
        }

        // eslint-disable-next-line
    }, [screenSharing, currentDisplayStream]);

    window.onChangeMediaDevices = () => {
        audioEnterRoom.setSinkId(audiooutput);
        audioLeaveRoom.setSinkId(audiooutput);
        // audioKnocking.setSinkId(audiooutput);
        audioNewMessage.setSinkId(audiooutput);
        window.refreshAudioOutputDevice();
    };

    const setEvents = () => {
        setSocketEvents();
        setPeerEvents();
    };

    const setSocketEvents = () => {
        socket.on("connect", () => {
            setConnected(socket.connected);
        });

        socket.on("disconnect", (reason) => {
            leaveRoom();
        });

        socket.on("user-connected", (userId, userName) => {
            const checkMyStream = () => {
                if (!currentUserStream) {
                    setTimeout(checkMyStream, 100);
                } else {
                    connectToNewUser(
                        currentUserStream,
                        userId,
                        userName,
                        currentUserName
                    );
                }
            };

            checkMyStream();
        });

        socket.on("user-disconnected", (userId) => {
            if (window.connectedUsers[userId])
                window.connectedUsers[userId].close();
        });

        socket.on("invaded-not-allowed", () => {
            console.log("YOU SHALL NOT PASS");
            window.location.reload();
        });
    };

    const setPeerEvents = () => {
        peer.on("open", (peer_id) => {
            setMyId(peer_id);

            socket.emit(
                "join-room",
                room_id,
                peer_id,
                currentUserName,
                localStorage.getItem("locked_room_pass"),
                currentUserStream.getVideoTracks()[0]
                    ? currentUserStream.getVideoTracks()[0].enabled
                    : false,
                currentUserStream.getAudioTracks()[0].enabled
            );
        });

        peer.on("call", (call) => {
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

    const leaveRoom = () => {
        currentUserStream &&
            currentUserStream.getTracks().forEach((track) => {
                track.enabled = false;
            });

        setTimeout(() => {
            currentUserStream &&
                currentUserStream.getTracks().forEach((track) => {
                    track.stop();
                });
        }, 250);

        setTimeout(() => {
            peer && peer.removeAllListeners();
            socket && socket.removeAllListeners();

            peer && peer.destroy();
            socket && socket.disconnect();
            socket && socket.close();

            window.location.replace(`/${room_id}/out`);
        }, 500);
    };

    window.leaveRoom = leaveRoom;

    const stopScreenShare = () => {
        let peerConnections = Object.values({
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

        socket.emit("toggle-track", "screen", false);

        replaceSenderTrack(peerConnections, currentUserStream, "screen");
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
            .then((display_stream) => {
                let videoTrack = display_stream.getVideoTracks()[0];

                videoTrack.onended = function () {
                    videoTrack.enabled = false;
                    stopScreenShare(display_stream);
                };

                let peerConnections = Object.values({
                    ...window.connectedUsers,
                }).reduce((acc, curr) => {
                    return [...acc, curr.peerConnection];
                }, []);

                display_stream.addTrack(
                    currentUserStream
                        .getVideoTracks()
                        .find((item) => item.kind === "video")
                );

                let newStream = new MediaStream([
                    currentUserStream.getAudioTracks()[0],
                    currentUserStream.getVideoTracks()[0],
                    display_stream.getVideoTracks()[0],
                ]);

                setCurrentUserStream(newStream);

                socket.emit("toggle-track", "screen", true);

                setScreenSharing(true);

                replaceSenderTrack(peerConnections, newStream, "screen");
            })
            .catch((reason) =>
                console.error("Cannot get display because: ", reason)
            );
    };

    window.screenShare = screenShare;

    const sendMessage = (msg) => {
        socket.emit("message", msg);
    };

    window.sendMessage = sendMessage;

    const connectToNewUser = (stream, userId, userName, myUserName) => {
        const call = peer.call(userId, stream, {
            metadata: { username: myUserName },
        });

        call.on("stream", function (callStream) {
            if (window.connectedUsers[userId]) return;

            setConnectedUsers({
                ...window.connectedUsers,
                [userId]: call,
            });

            // window.forceUpdate && window.forceUpdate();
        });

        call.on("close", () => {
            setConnectedUsers({
                ...window.connectedUsers,
                [call.peer]: undefined,
            });
        });
    };

    const answerCall = (call, stream, myId) => {
        window.answer_stream = stream;

        call.answer(stream);

        call.on("stream", function (callStream) {
            if (window.connectedUsers[call.peer]) return;

            setConnectedUsers({
                ...window.connectedUsers,
                [call.peer]: call,
            });
        });

        call.on("disconnected", () => {
            setConnectedUsers({
                ...window.connectedUsers,
                [call.peer]: undefined,
            });
        });

        call.on("close", () => {
            setConnectedUsers({
                ...window.connectedUsers,
                [call.peer]: undefined,
            });
        });
    };

    return null;
}

export default Connection;
