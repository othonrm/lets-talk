import { useState } from "react";
import { renderToString } from "react-dom/server";
import FullscreenButton from "../components/FullscreenButton";

window.refreshAudioOutputDevice = () => {
    let audiooutput = localStorage.getItem("audiooutput_device");

    document
        .querySelectorAll(".video_container video")
        .forEach(async (video) => {
            if (
                audiooutput !== undefined &&
                audiooutput !== null &&
                audiooutput !== ""
            ) {
                await video.setSinkId(audiooutput);
            }
        });
};

export const addVideoStream = async (
    video,
    screenVideo,
    stream,
    userId,
    userName
) => {
    window.streams = [...(window.streams || []), stream];

    let audiooutput = localStorage.getItem("audiooutput_device");

    if (
        audiooutput !== undefined &&
        audiooutput !== null &&
        audiooutput !== ""
    ) {
        await video.setSinkId(audiooutput);
    }

    if (document.getElementById(userId)) return;

    if (
        stream.getVideoTracks().length > 1 &&
        stream.getVideoTracks()[1].enabled
    ) {
        if (!screenVideo)
            console.error(
                "Not possible to add screen sharing, no video element provided"
            );

        let new_stream = new MediaStream([stream.getVideoTracks()[1]]);

        screenVideo.srcObject = new_stream;

        screenVideo.addEventListener("loadedmetadata", () => {
            screenVideo.play();
        });

        let video_container = document.createElement("div");
        let id_text = document.createElement("p");
        let user_text = document.createElement("p");

        id_text.innerHTML = userId + "_screen";
        id_text.className = "user_id";

        user_text.innerHTML =
            userName.toString().toLocaleLowerCase("pt-BR") +
            " (Compartilhando Tela)";
        user_text.className = "user_name";

        video_container.className = "video_container screen";

        video_container.id = userId + "_screen";

        video_container.innerHTML = renderToString(<FullscreenButton />);
        let fullscreen_button = video_container.querySelector(
            ".fullscreen_button"
        );

        document.addEventListener("fullscreenchange", (e) => {
            if (document.fullscreenElement) {
                fullscreen_button.classList.add("hide");
            } else {
                fullscreen_button.classList.remove("hide");
            }
        });

        fullscreen_button.onclick = () => {
            fullscreen_button.parentNode.requestFullscreen();
        };

        video_container.append(screenVideo);
        video_container.append(id_text);
        video_container.append(user_text);

        video_container.ondblclick = (e) => setFocus(video_container.id);
        video_container.style.display = "none";

        let minimized_list = document.getElementById("minimized_list");
        let video_grid = document.getElementById("video_grid");

        if (minimized_list.classList.contains("show")) {
            minimized_list.append(video_container);
        } else {
            video_grid.append(video_container);
        }
    }

    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    let video_container = document.createElement("div");
    let id_text = document.createElement("p");
    let user_text = document.createElement("p");

    id_text.innerHTML = userId;
    id_text.className = "user_id";

    user_text.innerHTML = userName.toString().toLocaleLowerCase("pt-BR");
    user_text.className = "user_name";

    video_container.className = "video_container";

    video_container.id = userId;

    video_container.innerHTML = renderToString(<FullscreenButton />);
    let fullscreen_button = video_container.querySelector(".fullscreen_button");

    document.addEventListener("fullscreenchange", (e) => {
        if (document.fullscreenElement) {
            fullscreen_button.classList.add("hide");
        } else {
            fullscreen_button.classList.remove("hide");
        }
    });

    fullscreen_button.onclick = () => {
        fullscreen_button.parentNode.requestFullscreen();
    };

    video_container.append(video);
    video_container.append(id_text);
    video_container.append(user_text);

    video_container.ondblclick = (e) => setFocus(video_container.id);

    let minimized_list = document.getElementById("minimized_list");
    let video_grid = document.getElementById("video_grid");

    if (minimized_list.classList.contains("show")) {
        minimized_list.append(video_container);
    } else {
        video_grid.append(video_container);
    }

    return video_container;
};

export const useForceUpdate = () => {
    // eslint-disable-next-line
    const [value, setValue] = useState(0);

    return () => setValue((value) => ++value);
};

export const dummyTrack = () => {
    let silence = () => {
        let ctx = new AudioContext(),
            oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        return Object.assign(dst.stream.getAudioTracks()[0], {
            enabled: false,
        });
    };

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), {
            width,
            height,
        });
        canvas.getContext("2d").fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    let blackSilence = (...args) =>
        new MediaStream([black(...args), silence()]);

    let video = document.createElement("video");

    video.srcObject = blackSilence({ width: 640, height: 480 });

    video.addEventListener("loadedmetadata", () => {
        video.play();

        console.log("PLAAAY");
    });

    return video.srcObject;
};

export const replaceSenderTrack = (
    peerConnections,
    stream,
    myScreenVideoRef
) => {
    // let tracks = stream.getTracks();

    peerConnections.forEach((item, index) => {
        if (!item) return;

        let senders = item.getSenders().filter(function (s) {
            return s.track === null || s.track.kind === "video";
        });

        senders[0].replaceTrack(
            stream
                .getVideoTracks()
                .find((item) => !item.kind2 && item.label.indexOf("screen") < 0)
        );
        senders[1].replaceTrack(
            stream
                .getVideoTracks()
                .find((item) => item.kind2 || item.label.indexOf("screen") >= 0)
        );
    });

    if (myScreenVideoRef.current) myScreenVideoRef.current.srcObject = stream;
};

export const setFocus = (focus_id) => {
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

export const computeAudioLevel = (media_stream, audioBarsRefs) => {
    let audioContext = new AudioContext(); // NEW!!
    let analyser = audioContext.createAnalyser();
    let microphone = audioContext.createMediaStreamSource(media_stream);
    let javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    javascriptNode.onaudioprocess = function () {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var values = 0;

        var length = array.length;
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        var average = values / length;

        audioBarsRefs.forEach((bar, index) => {
            if (bar && bar.current)
                bar.current.style.height = `${
                    8 + average / (index === 1 ? 2 : 5)
                }px`;
        });
    };

    return () => {
        javascriptNode.removeEventListener(
            javascriptNode,
            javascriptNode.onaudioprocess
        );
    };
};
