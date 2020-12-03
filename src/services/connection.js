import { useEffect, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";

const socket = io(
    process.env.NODE_ENV === "development" ? "localhost:8080" : "/"
);

console.log(process.env.NODE_ENV);

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    secure: process.env.NODE_ENV === "development" ? false : true,
    port: process.env.NODE_ENV === "development" ? 8080 : 443,
});

const peers = {};

let currentUserStream;
let myId;

socket.on("user-disconnected", (userId) => {
    if (peers[userId]) peers[userId].close();
});

socket.on("received-message", (msg) => {
    console.log(msg);
});

peer.on("open", (id) => {
    let room_id = "123";

    myId = id;

    socket.emit("join-room", room_id, id);
});

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

const connectToNewUser = (userId, stream) => {
    console.log("making call");

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
    console.log("answering call");

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

function addVideoStream(video, stream, userId) {
    console.log("aaaa");

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
}

const Connection = () => {
    const [startedMedia, setStartedMedia] = useState(undefined);

    useEffect(() => {
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        console.log(currentUserStream);

        // eslint-disable-next-line
    }, [currentUserStream]);

    useEffect(() => {
        const userVideo = document.createElement("video");
        userVideo.muted = true;

        if (!startedMedia) {
            navigator.mediaDevices
                .getUserMedia({
                    video: true,
                    audio: true,
                })
                .then((media_stream) => {
                    currentUserStream = media_stream;

                    console.log("AAAAAAAA");

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
    }, [startedMedia]);

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

export default Connection;
