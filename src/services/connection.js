import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import { matchPath } from "react-router";

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

const Connection = () => {
    const current_path = matchPath(window.location.pathname, {
        path: "/:room_id",
        exact: true,
    });
    const forceUpdate = useForceUpdate();

    window.forceUpdate = forceUpdate;

    const myVideoElement = document.createElement("video");

    const [startedMedia, setStartedMedia] = useState(undefined);
    const [currentUserStream, setCurrentUserStream] = useState(undefined);
    const [myId, setMyId] = useState(undefined);
    const [connected, setConnected] = useState(socket && socket.connected);
    const [sharingScreen, setSharingScreen] = useState(undefined);
    const [currentDisplayStream, setCurrentDisplayStream] = useState(undefined);

    const myVideoRef = useRef(myVideoElement);

    const leaveRoom = () => {
        console.log(currentUserStream.getVideoTracks());

        currentUserStream.getTracks().forEach((track) => track.stop());

        peer.disconnect();
        socket.disconnect();
    };

    window.leaveRoom = leaveRoom;

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

                    addVideoStream(myVideoElement, media_stream, myId);
                })
                .catch((reason) =>
                    alert("Cannot get video because: " + reason)
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
                    ":scope > p:first-of-type"
                ).innerHTML = myId;

                myVideoRef.current.parentElement.style.border =
                    "2px solid #c16bd5";
            }
        }
    }, [myId]);

    const setEvents = () => {
        setSocketEvents();
        setPeerEvents();
    };

    const stopScreenShare = () => {
        let videoTrack = currentUserStream.getVideoTracks()[0];

        let peerConnections = Object.values({
            ...connectedUsers,
        }).reduce((acc, curr) => {
            return [...acc, curr.peerConnection];
        }, []);

        peerConnections.forEach((item, index) => {
            if (!item) return;

            let sender = item.getSenders().find(function (s) {
                return s.track.kind === videoTrack.kind;
            });

            sender.replaceTrack(videoTrack);
        });
        if (myVideoRef.current)
            myVideoRef.current.srcObject = currentUserStream;
    };

    const screenShare = () => {
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

                peerConnections.forEach((item, index) => {
                    if (!item) return;

                    let sender = item.getSenders().find(function (s) {
                        return s.track.kind === videoTrack.kind;
                    });

                    sender.replaceTrack(videoTrack);
                });

                if (myVideoRef.current)
                    myVideoRef.current.srcObject = display_stream;
            })
            .catch((reason) => alert("Cannot get display because: " + reason));
    };

    useEffect(() => {
        console.log(
            sharingScreen,
            currentDisplayStream,
            peer && peer.connected
        );

        if (
            sharingScreen &&
            currentDisplayStream &&
            socket &&
            !socket.connected
        ) {
            console.log("reconnecting peer");

            peer.removeAllListeners("call");

            peer.on("call", (call) => {
                console.log("receiving call", call);

                if (sharingScreen && currentDisplayStream) {
                    console.log("answering with display stream");

                    answerCall(call, currentDisplayStream, myId);
                } else {
                    const checkMyStream = () => {
                        if (!currentUserStream) {
                            console.log("waiting media stream 1");
                            setTimeout(checkMyStream, 100);
                        } else {
                            answerCall(call, currentUserStream, myId);
                        }
                    };

                    checkMyStream();
                }
            });

            socket.connect();
        }
    }, [sharingScreen, currentDisplayStream]);

    window.connectedUsers = connectedUsers;

    window.screenShare = screenShare;

    const setSocketEvents = () => {
        socket.on("connect", function () {
            console.log("CONNECTED");
            setConnected(socket.connected);

            if (peer.disconnected) {
                peer.reconnect();
            }
        });

        socket.on("user-connected", (userId) => {
            const checkMyStream = () => {
                if (!currentUserStream) {
                    console.log("waiting media stream 2");
                    setTimeout(checkMyStream, 100);
                } else {
                    connectToNewUser(userId, currentUserStream);
                }
            };

            checkMyStream();
        });

        socket.on("user-disconnected", (userId) => {
            console.log(`User disconnected: ${userId}`);

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

            socket.emit("join-room", room_id, peer_id);
        });

        peer.on("call", (call) => {
            console.log("receiving call", call);

            if (sharingScreen && currentDisplayStream) {
                console.log("answer call with sharing display stream");
            }

            const checkMyStream = () => {
                if (!currentUserStream) {
                    console.log("waiting media stream 1");
                    setTimeout(checkMyStream, 100);
                } else {
                    answerCall(call, currentUserStream, myId);
                }
            };

            checkMyStream();
        });
    };

    const sendMessage = (msg) => {
        socket.emit("message", msg);
    };

    const toggleMute = () => {
        const isMuted = !currentUserStream.getAudioTracks()[0].enabled;

        if (isMuted) {
            currentUserStream.getAudioTracks()[0].enabled = true;
        } else {
            currentUserStream.getAudioTracks()[0].enabled = false;
        }
    };

    const toggleVideo = () => {
        const videoEnabled = currentUserStream.getVideoTracks()[0].enabled;

        if (videoEnabled) {
            currentUserStream.getVideoTracks()[0].enabled = false;
        } else {
            currentUserStream.getVideoTracks()[0].enabled = true;
        }
    };

    window.sendMessage = sendMessage;
    window.toggleMute = toggleMute;
    window.toggleVideo = toggleVideo;

    return null;
};

const connectToNewUser = (userId, stream, screen_share = false) => {
    console.log("making call");

    const call = peer.call(userId, stream);
    const video = document.createElement("video");

    call.on("stream", function (callStream) {
        if (connectedUsers[userId]) return;

        addVideoStream(video, callStream, userId, call.peer);

        connectedUsers[userId] = call;

        console.log(call);

        window.forceUpdate && window.forceUpdate();
    });

    call.on("close", () => {
        console.log("closing call");
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

        userContainer = addVideoStream(video, callStream, call.peer, myId);

        connectedUsers[call.peer] = call;
    });

    call.on("disconnected", () => {
        console.log("call is disconnected");
        userContainer && userContainer.remove();
    });

    call.on("close", () => {
        console.log("call is closing");
        userContainer && userContainer.remove();
    });
};

function addVideoStream(video, stream, userId, myId) {
    if (document.getElementById(userId)) return;

    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    let div = document.createElement("div");
    let text = document.createElement("p");
    text.innerHTML = userId;

    div.className = "video_container";

    div.id = userId;
    div.append(video);
    div.append(text);

    document.getElementById("video_grid").append(div);

    return div;
}

//create your forceUpdate hook
function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue((value) => ++value); // update the state to force render
}

export default Connection;
