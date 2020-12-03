import io from "socket.io-client";
import Peer from "peerjs";

const socket = io("localhost:8080");

console.log(process.env.NODE_ENV);

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    secure: process.env.NODE_ENV === "development" ? false : true,
    port: process.env.NODE_ENV === "development" ? 8080 : 443,
});

var myId;

peer.on("open", (id) => {
    myId = id;
    socket.emit("join-room", "123", id);
});

socket.on("user-disconnected", (userId) => {
    if (peers[userId]) peers[userId].close();
});

const userVideo = document.createElement("video");
userVideo.muted = true;

let currentUserStream;

const peers = {};

const addVideoStream = (video, stream, userId) => {
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

    div.append(video);
    div.append(text);

    document.getElementById("video-grid").append(div);

    return div;
};

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((media_stream) => {
        currentUserStream = media_stream;
        addVideoStream(userVideo, media_stream, myId);
    })
    .catch((reason) => alert("Cannot get video because: " + reason));

peer.on("call", (call) => {
    const checkMyStream = () => {
        if (!currentUserStream) {
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
            setTimeout(checkMyStream, 100);
        } else {
            connectToNewUser(userId, currentUserStream);
        }
    };

    checkMyStream();
});

socket.on("received-message", (msg) => {
    console.log(msg);
});

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
