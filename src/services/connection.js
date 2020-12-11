import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import { matchPath, useHistory, useParams } from "react-router";
import styled from "styled-components";

import {
    addVideoStream,
    computeAudioLevel,
    dummyTrack,
    replaceSenderTrack,
    useForceUpdate,
} from "../helpers";

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
import { darkmodeEnabled, darktheme, Flex } from "../helpers/styles";

import Button from "../components/Button";
import RoundedButton from "../components/RoundedButton";

import enter_room from "../assets/audios/enter_room.mp3";
import leave_room from "../assets/audios/leave_room.mp3";
import knocking from "../assets/audios/knocking.mp3";
import new_message from "../assets/audios/new_message.mp3";
import AudioLevels from "../components/AudioLevels";
import { renderToString } from "react-dom/server";

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

function Connection({ handleLeaveRoom, ...props }) {
    const { getUserMedia } = navigator.mediaDevices;
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
    const myScreenVideoElement = document.createElement("video");

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
    const myScreenVideoRef = useRef(myScreenVideoElement);

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

        let audioinput = localStorage.getItem("audioinput_device") || undefined;
        let videoinput = localStorage.getItem("videoinput_device") || undefined;

        let constraints = {
            video: videoinput ? { deviceId: videoinput } : !videoDisabled,
            audio: audioinput ? { deviceId: audioinput } : true,
        };

        if (!startedMedia) {
            getUserMedia(constraints)
                .then((media_stream) => {
                    let audio_enabled = localStorage.getItem("audio_enabled");
                    let video_enabled = localStorage.getItem("video_enabled");

                    if (audio_enabled === "true" || audio_enabled === "false") {
                        media_stream.getAudioTracks()[0].enabled =
                            audio_enabled === "true" ? true : false;
                    }
                    if (
                        (video_enabled === "true" ||
                            video_enabled === "false") &&
                        media_stream.getVideoTracks()[0]
                    ) {
                        media_stream.getVideoTracks()[0].enabled =
                            video_enabled === "true" ? true : false;
                    }

                    let dummy_track = dummyTrack().getVideoTracks()[0];

                    dummy_track.enabled = true;
                    dummy_track.kind2 = "screen";

                    dummy_track.stop();

                    console.log(dummy_track);

                    media_stream.addTrack(dummy_track);

                    console.log(
                        "MY VIDEO TRACKS: ",
                        media_stream.getVideoTracks()
                    );

                    setCurrentUserStream(media_stream);

                    addVideoStream(
                        myVideoElement,
                        myScreenVideoElement,
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
                ).innerHTML =
                    (currentUserName || "Guest") +
                    renderToString(
                        <CustomAudioLevels mediaStream={currentUserStream} />
                    );

                let audio_bars = myVideoRef.current.parentElement.querySelectorAll(
                    ".user_name .audio_level .audio_bar"
                );

                computeAudioLevel(currentUserStream, [
                    { current: audio_bars[0] },
                    { current: audio_bars[1] },
                    { current: audio_bars[2] },
                ]);

                myVideoRef.current.parentElement.style.border =
                    "2px solid #c16bd5";
                myVideoRef.current.parentElement.querySelector(
                    "video"
                ).style.transform = "scaleX(-1)";
            }

            if (
                myScreenVideoRef.current &&
                myScreenVideoRef.current.parentElement
            ) {
                const userIdElement = myScreenVideoRef.current.parentElement.querySelector(
                    ".user_id"
                );
                const userNameElement = myScreenVideoRef.current.parentElement.querySelector(
                    ".user_name"
                );
                if (userIdElement) userIdElement.innerHTML = myId + "_screen";

                if (userIdElement)
                    userNameElement.innerHTML =
                        (currentUserName || "Guest") + " (Compartilhando Tela)";

                myScreenVideoRef.current.parentElement.id = myId + "_screen";
                myScreenVideoRef.current.parentElement.style.border =
                    "2px solid #c16bd5";
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

    window.onChangeMediaDevices = () => {
        audioEnterRoom.setSinkId(audiooutput);
        audioLeaveRoom.setSinkId(audiooutput);
        audioKnocking.setSinkId(audiooutput);
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
            if (connectedUsers[userId]) connectedUsers[userId].close();

            document.getElementById(userId) &&
                document.getElementById(userId).remove();
            document.getElementById(userId + "_screen") &&
                document.getElementById(userId + "_screen").remove();
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
                currentUserStream.getVideoTracks()[0]
                    ? currentUserStream.getVideoTracks()[0].enabled
                    : false,
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
            currentUserStream.getTracks().forEach((track) => {
                track.enabled = false;
            });

        setTimeout(() => {
            currentUserStream &&
                currentUserStream.getTracks().forEach((track) => {
                    track.stop();
                });
        }, 500);

        setTimeout(() => {
            history.push(`/${room_id}/out`);

            peer && peer.removeAllListeners();
            socket && socket.removeAllListeners();

            peer && peer.destroy();
            socket && socket.disconnect();
            socket && socket.close();

            // setTimeout(window.location.reload, 500);
        }, 1000);
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

        socket.emit("toggle-track", "screen", false);

        replaceSenderTrack(
            peerConnections,
            currentUserStream,
            myScreenVideoRef
        );
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
                    ...connectedUsers,
                }).reduce((acc, curr) => {
                    return [...acc, curr.peerConnection];
                }, []);

                display_stream.addTrack(
                    currentUserStream
                        .getVideoTracks()
                        .find((item) => item.kind === "video")
                );

                socket.emit("toggle-track", "screen", true);

                setScreenSharing(true);

                replaceSenderTrack(
                    peerConnections,
                    display_stream,
                    myScreenVideoRef
                );
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
        let enabled;

        if (currentUserStream.getVideoTracks()[0]) {
            currentUserStream.getVideoTracks()[0].enabled = false;
        }

        if (
            !currentUserStream.getVideoTracks()[0] ||
            currentUserStream.getVideoTracks()[0].readyState === "ended"
        ) {
            getUserMedia({ video: true, audio: false }).then(
                async (media_stream) => {
                    if (currentUserStream.getVideoTracks()[0])
                        currentUserStream.removeTrack(
                            currentUserStream.getVideoTracks()[0]
                        );
                    currentUserStream.addTrack(
                        media_stream.getVideoTracks()[0]
                    );

                    let peerConnections = Object.values({
                        ...connectedUsers,
                    }).reduce((acc, curr) => {
                        return [...acc, curr.peerConnection];
                    }, []);

                    replaceSenderTrack(
                        peerConnections,
                        media_stream,
                        myVideoRef
                    );
                }
            );

            enabled = true;
        } else {
            setTimeout(() => {
                currentUserStream.getVideoTracks().forEach((track) => {
                    track.enabled = false;
                    track.stop();
                    currentUserStream.removeTrack(track);
                });
            }, 1000);
            enabled = false;
        }

        setVideoDisabled(!enabled);

        localStorage.setItem("video_enabled", enabled);

        socket.emit("toggle-track", "video", enabled);
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
                                color={darkmodeEnabled && darktheme.fontdark}
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
}

const connectToNewUser = (stream, userId, userName, myUserName) => {
    const call = peer.call(userId, stream, {
        metadata: { username: myUserName },
    });
    const video = document.createElement("video");
    const screenvideo = document.createElement("video");

    call.on("stream", function (callStream) {
        if (connectedUsers[userId]) return;

        addVideoStream(video, screenvideo, callStream, userId, userName);

        connectedUsers[userId] = call;

        window.forceUpdate && window.forceUpdate();
    });

    call.on("close", () => {
        document.getElementById(call.peer) &&
            document.getElementById(call.peer).remove();
        document.getElementById(call.peer + "_screen") &&
            document.getElementById(call.peer + "_screen").remove();
    });
};

const answerCall = (call, stream, myId) => {
    window.answer_stream = stream;

    call.answer(stream);

    const video = document.createElement("video");
    const screenvideo = document.createElement("video");
    let userContainer;

    call.on("stream", function (callStream) {
        console.log(callStream, callStream.getTracks());

        if (connectedUsers[call.peer]) return;

        userContainer = addVideoStream(
            video,
            screenvideo,
            callStream,
            call.peer,
            call.metadata.username
        );

        call.peerConnection.ontrack = (e) => {
            window.changed2 = e;
            console.log("ontrack", e);
        };

        connectedUsers[call.peer] = call;
    });

    call.on("disconnected", () => {
        delete connectedUsers[call.peer];
        userContainer && userContainer.remove && userContainer.remove();
        document.getElementById(call.peer + "_screen") &&
            document.getElementById(call.peer + "_screen").remove();
    });

    call.on("close", () => {
        delete connectedUsers[call.peer];
        userContainer && userContainer.remove && userContainer.remove();
        document.getElementById(call.peer + "_screen") &&
            document.getElementById(call.peer + "_screen").remove();
    });
};

export default Connection;

const VideoControls = styled.div`
    width: 100%;
    height: 80px;
    max-height: 80px;
    box-sizing: border-box;
    background-color: ${darktheme.primary};
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
    background-color: ${darktheme.primary};
    color: ${darktheme.fontdark};
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

const CustomAudioLevels = styled(AudioLevels)`
    position: initial;
    padding: 0px;
    margin: 0px;
    max-height: 20px;
    margin-left: 12px;
`;
