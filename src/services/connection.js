import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import { matchPath, useHistory, useParams } from "react-router";
import styled from "styled-components";

import { addVideoStream, replaceSenderTrack, useForceUpdate } from "../helpers";

import {
    FaMicrophoneAlt,
    FaMicrophoneAltSlash,
    FaVideo,
    FaVideoSlash,
    FaDesktop,
    FaSignOutAlt,
    FaLock,
    FaUnlock,
    FaUsers,
} from "react-icons/fa";
import { Flex } from "../helpers/styles";

import Button from "../components/Button";
import RoundedButton from "../components/RoundedButton";

import enter_room from "../assets/audios/enter_room.mp3";
import leave_room from "../assets/audios/leave_room.mp3";
import knocking from "../assets/audios/knocking.mp3";
import new_message from "../assets/audios/new_message.mp3";

let socket;
let peer;
let connectedUsers = {};

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

const Connection = ({ handleLeaveRoom, ...props }) => {
    const { room_id } = useParams();
    const history = useHistory();

    const current_path = matchPath(window.location.pathname, {
        path: "/:room_id",
        exact: true,
    });
    const forceUpdate = useForceUpdate();

    window.forceUpdate = forceUpdate;

    const currentUserName =
        localStorage.getItem("user_name") !== null &&
        localStorage.getItem("user_name") !== undefined &&
        localStorage.getItem("user_name") !== ""
            ? localStorage.getItem("user_name")
            : "Guest";
    const myVideoElement = document.createElement("video");

    const [startedMedia, setStartedMedia] = useState(undefined);
    const [currentUserStream, setCurrentUserStream] = useState(undefined);
    const [myId, setMyId] = useState(undefined);
    const [connected, setConnected] = useState(socket && socket.connected);
    const [screenSharing, setScreenSharing] = useState(false);
    const [currentDisplayStream, setCurrentDisplayStream] = useState(undefined);
    const [audioMuted, setAudioMuted] = useState(
        localStorage.getItem("audio_enabled") === "false" ? true : false
    );
    const [videoDisabled, setVideoDisabled] = useState(
        localStorage.getItem("video_enabled") === "false" ? true : false
    );
    const [roomLocked, setRoomLocked] = useState(false);
    const [roomOwner, setRoomOwner] = useState(false);
    const [knockRequests, setKnockRequests] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    window.onToggleSidePanel = () => {
        setUnreadCount(0);
    };

    window.onReceivedMessage = () => {
        if (!window.sidePanelActive) {
            setUnreadCount(unreadCount + 1);
            audioNewMessage.play();
        }
    };

    const audiooutput = localStorage.getItem("audiooutput_device");
    const audioEnterRoom = new Audio(enter_room);
    const audioLeaveRoom = new Audio(leave_room);
    const audioKnocking = new Audio(knocking);
    const audioNewMessage = new Audio(new_message);
    audioEnterRoom.volume = 0.5;
    audioLeaveRoom.volume = 0.5;
    audioKnocking.volume = 0.5;
    audioNewMessage.volume = 0.5;
    if (
        audiooutput !== undefined &&
        audiooutput !== null &&
        audiooutput !== ""
    ) {
        audioEnterRoom.setSinkId(audiooutput);
        audioLeaveRoom.setSinkId(audiooutput);
        audioKnocking.setSinkId(audiooutput);
        audioNewMessage.setSinkId(audiooutput);
    }

    const myVideoRef = useRef(myVideoElement);

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
        myVideoElement.muted = true;

        if (!startedMedia) {
            navigator.mediaDevices
                .getUserMedia({
                    video: true,
                    audio: true,
                })
                .then((media_stream) => {
                    let audio_enabled = localStorage.getItem("audio_enabled");
                    let video_enabled = localStorage.getItem("video_enabled");

                    if (audio_enabled === "true" || audio_enabled === "false") {
                        media_stream.getAudioTracks()[0].enabled =
                            audio_enabled === "true" ? true : false;
                    }
                    if (video_enabled === "true" || video_enabled === "false") {
                        media_stream.getVideoTracks()[0].enabled =
                            video_enabled === "true" ? true : false;
                    }

                    setCurrentUserStream(media_stream);

                    addVideoStream(
                        myVideoElement,
                        media_stream,
                        myId,
                        currentUserName
                    );
                })
                .catch((reason) =>
                    console.error("Cannot get video because: ", reason)
                );

            setStartedMedia(true);
        }

        return () => {
            document
                .querySelectorAll(".video_container")
                .forEach((element) => element.remove());
        };

        // eslint-disable-next-line
    }, [startedMedia]);

    useEffect(() => {
        if (myId) {
            if (myVideoRef.current) {
                myVideoRef.current.parentElement.id = myId;
                myVideoRef.current.parentElement.querySelector(
                    ".user_id"
                ).innerHTML = myId;
                myVideoRef.current.parentElement.querySelector(
                    ".user_name"
                ).innerHTML = currentUserName || myId;

                myVideoRef.current.parentElement.style.border =
                    "2px solid #c16bd5";
                myVideoRef.current.parentElement.querySelector(
                    "video"
                ).style.transform = screenSharing ? "" : "scaleX(-1)";
            }
        }

        // eslint-disable-next-line
    }, [myId, screenSharing]);

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

    useEffect(() => {
        if (knockRequests) {
            if (knockRequests.length > 0) {
                audioKnocking.play();
            }

            socket && socket.removeAllListeners("knock-request");

            socket &&
                socket.on("knock-request", (roomId, userName, socketId) => {
                    console.log("USer knocking: " + userName);
                    console.log(socketId);

                    setKnockRequests([...knockRequests, [socketId, userName]]);
                });
        }

        // eslint-disable-next-line
    }, [knockRequests]);

    const setEvents = () => {
        setSocketEvents();
        setPeerEvents();
    };

    const setSocketEvents = () => {
        socket.on("connect", () => {
            setConnected(socket.connected);
        });

        socket.on("disconnect", (reason) => {
            // leaveRoom();
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
            if (connectedUsers[userId]) connectedUsers[userId].close();

            document.getElementById(userId) &&
                document.getElementById(userId).remove();
        });

        socket.on("room-lock", (roomLockStatus) => {
            console.log("Room lock status: " + roomLockStatus);
            setRoomLocked(roomLockStatus);
        });

        socket.on("room-owner", (roomOwnerId) => {
            console.log("Room owner id: " + roomOwnerId);
            setRoomOwner(socket.id === roomOwnerId);
        });

        socket.on("knock-request", (roomId, userName, socketId) => {
            console.log(`User knocking: ${userName} ${socketId}`);

            setKnockRequests([...knockRequests, [socketId, userName]]);
        });

        socket.on("invaded-not-allowed", () => {
            console.log("YOU SHALL NOT PASS");
            window.location.reload();
        });
    };

    const setPeerEvents = () => {
        peer.on("open", (peer_id) => {
            if (!current_path || !current_path.params) {
                window.location.replace("/");
            }

            let room_id = current_path.params.room_id;

            setMyId(peer_id);

            socket.emit(
                "join-room",
                room_id,
                peer_id,
                currentUserName,
                localStorage.getItem("locked_room_pass"),
                currentUserStream.getVideoTracks()[0].enabled,
                currentUserStream.getAudioTracks()[0].enabled
            );
        });

        peer.on("call", (call) => {
            console.log("receiving call");
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
            currentUserStream.getTracks().forEach((track) => track.stop());

        history.push(`/${room_id}/out`);

        peer && peer.removeAllListeners();
        socket && socket.removeAllListeners();

        peer && peer.destroy();
        socket && socket.disconnect();
        socket && socket.close();

        window.location.reload();
    };

    window.leaveRoom = leaveRoom;

    const stopScreenShare = () => {
        let peerConnections = Object.values({
            ...connectedUsers,
        }).reduce((acc, curr) => {
            return [...acc, curr.peerConnection];
        }, []);

        setScreenSharing(false);
        setCurrentDisplayStream(undefined);

        replaceSenderTrack(peerConnections, currentUserStream, myVideoRef);
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
                    stopScreenShare(display_stream);
                };

                let peerConnections = Object.values({
                    ...connectedUsers,
                }).reduce((acc, curr) => {
                    return [...acc, curr.peerConnection];
                }, []);

                setScreenSharing(true);
                setCurrentDisplayStream(display_stream);

                replaceSenderTrack(peerConnections, display_stream, myVideoRef);
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

    const letEnter = (socketId) => {
        socket.emit("knock-response", socketId);
        setKnockRequests([
            ...knockRequests.filter((item) => item[0] !== socketId),
        ]);
    };

    window.letEnter = letEnter;

    const handleRejectRequest = (socketId) => {
        setKnockRequests([
            ...knockRequests.filter((item) => item[0] !== socketId),
        ]);
    };

    window.letEnter = letEnter;

    const lockRoom = () => {
        socket.emit("lock-room", room_id);
    };

    window.lockRoom = lockRoom;

    const toggleMute = () => {
        const isMuted = !currentUserStream.getAudioTracks()[0].enabled;

        if (isMuted) {
            currentUserStream.getAudioTracks()[0].enabled = true;
        } else {
            currentUserStream.getAudioTracks()[0].enabled = false;
        }

        window.audioMuted = !currentUserStream.getAudioTracks()[0].enabled;
        setAudioMuted(window.audioMuted);

        socket.emit(
            "toggle-track",
            "audio",
            currentUserStream.getAudioTracks()[0].enabled
        );
    };

    window.toggleMute = toggleMute;

    const toggleVideo = () => {
        const videoEnabled = currentUserStream.getVideoTracks()[0].enabled;

        if (videoEnabled) {
            currentUserStream.getVideoTracks()[0].enabled = false;
        } else {
            currentUserStream.getVideoTracks()[0].enabled = true;
        }

        window.videoDisabled = !currentUserStream.getVideoTracks()[0].enabled;
        setVideoDisabled(window.videoDisabled);

        socket.emit(
            "toggle-track",
            "video",
            currentUserStream.getVideoTracks()[0].enabled
        );
    };

    window.toggleVideo = toggleVideo;

    return (
        <>
            {knockRequests &&
                roomOwner &&
                knockRequests.map((request, index) => (
                    <KockModal key={request} index={index}>
                        {request[1] || "Anônimo"} deseja entrar no papo
                        <Flex>
                            <Button
                                onClick={() => letEnter(request[0])}
                                outlined
                                margin="16px 10px 0 0"
                            >
                                Permitir
                            </Button>
                            <Button
                                onClick={() => handleRejectRequest(request[0])}
                                margin="16px 0 0 0"
                            >
                                Negar
                            </Button>
                        </Flex>
                    </KockModal>
                ))}

            <VideoControls>
                <Flex margin="auto">
                    <RoundedButton muted={audioMuted} onClick={toggleMute}>
                        {audioMuted ? (
                            <FaMicrophoneAltSlash />
                        ) : (
                            <FaMicrophoneAlt />
                        )}
                    </RoundedButton>

                    <RoundedButton muted={videoDisabled} onClick={toggleVideo}>
                        {videoDisabled ? <FaVideoSlash /> : <FaVideo />}
                    </RoundedButton>

                    <RoundedButton muted={screenSharing} onClick={screenShare}>
                        <FaDesktop />
                    </RoundedButton>

                    {roomOwner && (
                        <RoundedButton onClick={lockRoom}>
                            {roomLocked ? <FaLock /> : <FaUnlock />}
                        </RoundedButton>
                    )}

                    <RoundedButton
                        onClick={window.toggleSidePanel}
                        badge={unreadCount > 0 ? unreadCount : false}
                    >
                        <FaUsers />
                    </RoundedButton>

                    <Flex mobile>
                        <RoundedButton muted onClick={handleLeaveRoom}>
                            <FaSignOutAlt />
                        </RoundedButton>
                    </Flex>
                </Flex>
                <Flex desktop>
                    <LeaveButton onClick={handleLeaveRoom}>
                        <span>Sair</span> <FaSignOutAlt />
                    </LeaveButton>
                </Flex>
            </VideoControls>
        </>
    );
};

const connectToNewUser = (stream, userId, userName, myUserName) => {
    const call = peer.call(userId, stream, {
        metadata: { username: myUserName },
    });
    const video = document.createElement("video");

    call.on("stream", function (callStream) {
        if (connectedUsers[userId]) return;

        addVideoStream(video, callStream, userId, userName);

        connectedUsers[userId] = call;

        window.forceUpdate && window.forceUpdate();
    });

    call.on("close", () => {
        document.getElementById(call.peer) &&
            document.getElementById(call.peer).remove();
    });
};

const answerCall = (call, stream, myId) => {
    console.log("answering call");

    call.answer(stream);

    const video = document.createElement("video");
    let userContainer;

    call.on("stream", function (callStream) {
        if (connectedUsers[call.peer]) return;

        userContainer = addVideoStream(
            video,
            callStream,
            call.peer,
            call.metadata.username
        );

        connectedUsers[call.peer] = call;
    });

    call.on("disconnected", () => {
        delete connectedUsers[call.peer];
        userContainer && userContainer.remove && userContainer.remove();
    });

    call.on("close", () => {
        delete connectedUsers[call.peer];
        userContainer && userContainer.remove && userContainer.remove();
    });
};

export default Connection;

const VideoControls = styled.div`
    width: 100%;
    height: 80px;
    max-height: 80px;
    box-sizing: border-box;
    background-color: #fff;
    box-shadow: 0px -3px 6px rgba(0, 0, 0, 0.36);
    z-index: 1;
    flex: 1;

    display: flex;
    justify-content: center;
    align-items: center;

    padding: 1rem;
`;

const LeaveButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #d73232;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    border: none;
    cursor: pointer;

    text-decoration: none;
    padding: 0.5rem 2rem;
    border-radius: 8px;
    color: #fff;
    font-size: 17px;

    & > :not(:first-child) {
        margin-left: 8px;
    }
`;

const KockModal = styled.div`
    position: absolute;
    top: ${(props) => `${80 + props.index * 120}`}px;
    right: 0;
    background: #fff;
    margin: 10px;
    font-size: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    padding: 14px 10px;
    z-index: 5;
`;
