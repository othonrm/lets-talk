import { useEffect, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";

const socket = io("othon-peerjs-test.herokuapp.com");

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "https://othon-peerjs-test.herokuapp.com",
    port: 80,
});

const peers = {};

const Connection = () => {
    const [startedMedia, setStartedMedia] = useState(undefined);
    const [myId, setMyId] = useState(undefined);
    const [currentUserStream, setCurrentUserStream] = useState(undefined);

    useEffect(() => {
        peer.on("open", (id) => {
            let room_id = "123";

            setMyId(id);

            socket.emit("join-room", room_id, id);
        });

        socket.on("user-disconnected", (userId) => {
            if (peers[userId]) peers[userId].close();
        });

        socket.on("received-message", (msg) => {
            console.log(msg);
        });

        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (currentUserStream) {
            peer.on("call", (call) => {
                const checkMyStream = () => {
                    if (!currentUserStream) {
                        console.log("waiting media stream 1");
                        setTimeout(checkMyStream, 100);
                    } else {
                        answerCall(call, currentUserStream);
                    }
                };

                checkMyStream();
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
        }

        // eslint-disable-next-line
    }, [currentUserStream]);

    useEffect(() => {
        const userVideo = document.createElement("video");
        userVideo.muted = true;

        if (myId && !startedMedia) {
            navigator.mediaDevices
                .getUserMedia({
                    video: true,
                    audio: true,
                })
                .then((media_stream) => {
                    setCurrentUserStream(media_stream);

                    addVideoStream(userVideo, media_stream, myId);
                })
                .catch((reason) =>
                    alert("Cannot get video because: " + reason)
                );

            setStartedMedia(true);
        }

        return () => {
            userVideo.remove();
            document.getElementById(myId) &&
                document.getElementById(myId).remove();
        };

        // eslint-disable-next-line
    }, [myId, startedMedia]);

    const addVideoStream = (video, stream, userId) => {
        if (document.getElementById(userId)) return;

        video.srcObject = stream;
        video.addEventListener("loadedmetadata", () => {
            video.play();
        });

        if (userId === myId) {
            video.style.border = "1px solid red";
        }
        video.setAttribute("user-id", userId);

        let div = document.createElement("div");
        let text = document.createElement("p");
        text.innerHTML = userId;

        div.id = userId;
        div.append(video);
        div.append(text);

        document.getElementById("video-grid").append(div);

        return div;
    };

    const connectToNewUser = (userId, stream) => {
        const fakeMediaStream = new MediaStream([
            createEmptyAudioTrack(),
            createEmptyVideoTrack({ width: 640, height: 480 }),
        ]);

        const call = peer.call(userId, stream);
        const video = document.createElement("video");
        let userContainer;

        call.on("stream", function (callStream) {
            if (peers[userId]) return;
            userContainer = addVideoStream(video, callStream, userId, call);
            peers[userId] = call;
        });

        call.on("close", () => {
            userContainer && userContainer.remove();
        });
    };

    const answerCall = (call, stream) => {
        call.answer(stream);
        const video = document.createElement("video");
        let userContainer;

        call.on("stream", function (callStream) {
            if (peers[call.peer]) return;
            userContainer = addVideoStream(video, callStream, call.peer);
            peers[call.peer] = call;
        });

        call.on("close", () => {
            userContainer && userContainer.remove();
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

    const createEmptyAudioTrack = () => {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        const track = dst.stream.getAudioTracks()[0];
        return Object.assign(track, { enabled: false });
    };

    const createEmptyVideoTrack = ({ width, height }) => {
        const canvas = Object.assign(document.createElement("canvas"), {
            width,
            height,
        });
        canvas.getContext("2d").fillRect(0, 0, width, height);

        const stream = canvas.captureStream();
        const track = stream.getVideoTracks()[0];

        return Object.assign(track, { enabled: false });
    };

    return null;
};

export default Connection;
