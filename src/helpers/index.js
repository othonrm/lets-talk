import { useState } from "react";

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

export const useForceUpdate = () => {
    // eslint-disable-next-line
    const [value, setValue] = useState(0);

    return () => setValue((value) => ++value);
};

export const dummyStream = () => {
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

    return blackSilence({ width: 640, height: 480 });
};

export const dummyVideoTrack = () => {
    let track = dummyStream().getVideoTracks()[0];
    // track.enabled = false;
    return track;
};

export const dummyAudioTrack = () => {
    let track = dummyStream().getAudioTracks()[0];
    // track.enabled = false;
    return track;
};

export const replaceSenderTrack = (peerConnections, stream, type) => {
    if (!type) return;

    peerConnections.forEach((item) => {
        if (!item) return;

        let senders = item.getSenders().filter(function (s) {
            return type === "video" || type === "screen"
                ? s.track === null || s.track.kind === "video"
                : type === "audio"
                ? s.track.kind === "audio"
                : false;
        });

        if (type === "video" && senders[0]) {
            senders[0].replaceTrack(
                stream
                    .getVideoTracks()
                    .find(
                        (item) =>
                            !item.kind2 && item.label.indexOf("screen") < 0
                    )
            );
        } else if (type === "screen" && senders[1]) {
            senders[1].replaceTrack(
                stream
                    .getVideoTracks()
                    .find(
                        (item) =>
                            item.kind2 || item.label.indexOf("screen") >= 0
                    )
            );
        } else if (type === "audio" && senders[0].track.kind === "audio") {
            senders[0].replaceTrack(stream.getAudioTracks()[0]);
        }
    });
};

export const setFocus = (focus_id) => {
    let focus_element = document.getElementById(focus_id);
    let minimized_list = document.getElementById("minimized_list");
    let video_grid = document.getElementById("video_grid");

    if (
        focus_element &&
        (focus_element.parentNode.id !== "video_grid" ||
            !minimized_list.classList.contains("show"))
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

    const onAudio = () => {
        if (
            !media_stream.getAudioTracks()[0] ||
            !media_stream.getAudioTracks()[0].enabled ||
            media_stream.getAudioTracks()[0].muted ||
            media_stream.getAudioTracks()[0].readyState === "ended"
        ) {
            javascriptNode.removeEventListener("audioprocess", onAudio);
            return;
        }

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

    javascriptNode.onaudioprocess = onAudio;

    const removeListener = () => {
        javascriptNode.removeEventListener(
            javascriptNode,
            javascriptNode.onaudioprocess
        );
    };

    return removeListener;
};

export const getInitals = (name = "Guest") => {
    let firstInitial = "G";
    let secondInitial = "";

    name = name.trim().split(" ");

    if (name.length > 0) {
        firstInitial = name[0][0];

        if (name.length > 1) {
            secondInitial = name[1][0];
        }
    }

    return firstInitial + secondInitial;
};
