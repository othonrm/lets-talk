import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import { matchPath } from "react-router";
import styled, { css } from "styled-components";

import {
    FaMicrophoneAlt,
    FaMicrophoneAltSlash,
    FaVideo,
    FaVideoSlash,
    FaDesktop,
    FaSignOutAlt,
} from "react-icons/fa";
import { Flex } from "../helpers/styles";

let socket;
let peer;
let connectedUsers = {};

const connectSocketNPeer = (callback) => {
    socket = io(
        process.env.NODE_ENV === "development" ? "localhost:8080" : "/"
    );

    peer = new Peer(undefined, {
        path: "/peerjs",
        host: "/",
        secure: process.env.NODE_ENV === "development" ? false : true,
        port: process.env.NODE_ENV === "development" ? 8080 : 443,
    });

    callback && callback();
};

const Connection = ({ handleLeaveRoom, ...props }) => {
    const current_path = matchPath(window.location.pathname, {
        path: "/:room_id",
        exact: true,
    });
    const forceUpdate = useForceUpdate();

    window.forceUpdate = forceUpdate;

    const currentUserName = localStorage.getItem("user_name");
    const myVideoElement = document.createElement("video");

    const [startedMedia, setStartedMedia] = useState(undefined);
    const [currentUserStream, setCurrentUserStream] = useState(undefined);
    const [myId, setMyId] = useState(undefined);
    const [connected, setConnected] = useState(socket && socket.connected);
    const [screenSharing, setScreenSharing] = useState(false);
    const [currentDisplayStream, setCurrentDisplayStream] = useState(undefined);
    const [audioMuted, setAudioMuted] = useState(false);
    const [videoDisabled, setVideoDisabled] = useState(false);

    const myVideoRef = useRef(myVideoElement);

    useEffect(() => {
        if (currentUserStream && !connected) {
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

    const setEvents = () => {
        setSocketEvents();
        setPeerEvents();
    };

    const setSocketEvents = () => {
        socket.on("connect", function () {
            setConnected(socket.connected);
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

        socket.on("received-message", (msg) => {
            console.log(msg);
        });
    };

    const setPeerEvents = () => {
        peer.on("open", (peer_id) => {
            if (!current_path || !current_path.params) {
                window.location.replace("/");
            }

            let room_id = current_path.params.room_id;

            setMyId(peer_id);

            socket.emit("join-room", room_id, peer_id, currentUserName);
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

        peer && peer.removeAllListeners();
        socket && socket.removeAllListeners();

        peer && peer.destroy();
        socket && socket.disconnect();
        socket && socket.close();
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

    const toggleMute = () => {
        const isMuted = !currentUserStream.getAudioTracks()[0].enabled;

        if (isMuted) {
            currentUserStream.getAudioTracks()[0].enabled = true;
        } else {
            currentUserStream.getAudioTracks()[0].enabled = false;
        }

        window.audioMuted = !currentUserStream.getAudioTracks()[0].enabled;
        setAudioMuted(window.audioMuted);
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
    };

    window.toggleVideo = toggleVideo;

    return (
        <>
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
                </Flex>
                <LeaveButton onClick={handleLeaveRoom}>
                    <span>Sair</span> <FaSignOutAlt />
                </LeaveButton>
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
        userContainer && userContainer.remove();
    });

    call.on("close", () => {
        delete connectedUsers[call.peer];
        userContainer && userContainer.remove();
    });
};

function addVideoStream(video, stream, userId, userName) {
    if (document.getElementById(userId)) return;

    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    let video_container = document.createElement("div");
    let id_text = document.createElement("p");
    let user_text = document.createElement("p");

    id_text.innerHTML = userId;
    id_text.className = "user_id";

    user_text.innerHTML = userName;
    user_text.className = "user_name";

    video_container.className = "video_container";

    video_container.id = userId;
    video_container.append(video);
    video_container.append(id_text);
    video_container.append(user_text);

    video_container.ondblclick = (e) => setFocus(e.target.id);

    document.getElementById("video_grid").append(video_container);

    return video_container;
}

const setFocus = (focus_id) => {
    console.log("focusing on: " + focus_id);

    let focus_element = document.getElementById(focus_id);
    let minimized_list = document.getElementById("minimized_list");
    let video_grid = document.getElementById("video_grid");

    if (
        focus_element.parentNode.id !== "video_grid" ||
        !minimized_list.classList.contains("show")
    ) {
        document.querySelectorAll(".video_container").forEach((el) => {
            if (el.id !== focus_id) {
                minimized_list.append(el);
            } else {
                video_grid.append(el);
            }
        });
    } else {
        document.querySelectorAll(".video_container").forEach((el) => {
            video_grid.append(el);
        });
    }

    if (minimized_list.childNodes.length > 0) {
        minimized_list.classList.add("show");
        video_grid.classList.add("minimized");
    } else {
        minimized_list.classList.remove("show");
        video_grid.classList.remove("minimized");
    }
};

window.setFocus = setFocus;

//create your forceUpdate hook
function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state

    return () => setValue((value) => ++value); // update the state to force render
}

const replaceSenderTrack = (peerConnections, stream, elementRef) => {
    let videoTrack = stream.getVideoTracks()[0];

    peerConnections.forEach((item, index) => {
        if (!item) return;

        let sender = item.getSenders().find(function (s) {
            return s.track.kind === videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
    });

    if (elementRef.current) elementRef.current.srcObject = stream;
};

export default Connection;

const VideoControls = styled.div`
    width: 100%;
    height: 80px;
    box-sizing: border-box;
    background-color: #fff;
    box-shadow: 0px -3px 6px rgba(0, 0, 0, 0.36);
    z-index: 1;

    display: flex;
    justify-content: center;
    align-items: center;

    padding: 1rem;
`;

const RoundedButton = styled.button`
    background-color: #fff;
    width: 48px;
    height: 48px;
    font-size: 18px;
    border-radius: 100%;
    border: none;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);

    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    :hover {
        opacity: 0.7;
    }

    :not(:last-child) {
        margin-right: 1rem;
    }

    ${(props) =>
        props.muted &&
        css`
            background-color: #fb5555;
            color: #fff;
        `}
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
