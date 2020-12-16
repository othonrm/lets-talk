import { useState } from 'react';

window.refreshAudioOutputDevice = () => {
    const audiooutput = localStorage.getItem('audiooutput_device');

    document.querySelectorAll('.video_container video').forEach(async video => {
        if (
            audiooutput !== undefined &&
            audiooutput !== null &&
            audiooutput !== ''
        ) {
            await video.setSinkId(audiooutput);
        }
    });
};

export const useForceUpdate = () => {
    // eslint-disable-next-line
    const [value, setValue] = useState(0);

    return () => setValue(val => val + 1);
};

export const dummyStream = () => {
    const silence = () => {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        return Object.assign(dst.stream.getAudioTracks()[0], {
            enabled: false,
        });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        const canvas = Object.assign(document.createElement('canvas'), {
            width,
            height,
        });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const blackSilence = (...args) =>
        new MediaStream([black(...args), silence()]);

    return blackSilence({ width: 640, height: 480 });
};

export const dummyVideoTrack = () => {
    const track = dummyStream().getVideoTracks()[0];

    return track;
};

export const dummyAudioTrack = () => {
    const track = dummyStream().getAudioTracks()[0];

    return track;
};

export const replaceSenderTrack = (peerConnections, stream, type) => {
    if (!type) return;

    peerConnections.forEach(item => {
        if (!item) return;

        const senders = item.getSenders().filter(sender => {
            let filterResult = false;

            if (type === 'video' || type === 'screen') {
                filterResult =
                    sender.track === null || sender.track.kind === 'video';
            } else if (type === 'audio') {
                filterResult = sender.track.kind === 'audio';
            }

            return filterResult;
        });

        if (type === 'video' && senders[0]) {
            senders[0].replaceTrack(
                stream
                    .getVideoTracks()
                    .find(
                        videoTracks =>
                            !videoTracks.kind2 &&
                            videoTracks.label.indexOf('screen') < 0,
                    ),
            );
        } else if (type === 'screen' && senders[1]) {
            senders[1].replaceTrack(
                stream
                    .getVideoTracks()
                    .find(
                        videoTracks =>
                            videoTracks.kind2 ||
                            videoTracks.label.indexOf('screen') >= 0,
                    ),
            );
        } else if (type === 'audio' && senders[0].track.kind === 'audio') {
            senders[0].replaceTrack(stream.getAudioTracks()[0]);
        }
    });
};

export const setFocus = focusId => {
    const focusElement = document.getElementById(focusId);
    const minimizedList = document.getElementById('minimized_list');
    const videoGrid = document.getElementById('video_grid');

    if (
        focusElement &&
        (focusElement.parentNode.id !== 'video_grid' ||
            !minimizedList.classList.contains('show'))
    ) {
        document.querySelectorAll('.video_container').forEach(el => {
            if (el.id !== focusId) {
                minimizedList.append(el);
            } else {
                videoGrid.append(el);
            }
        });
    } else {
        document.querySelectorAll('.video_container').forEach(el => {
            videoGrid.append(el);
        });
    }

    if (minimizedList.childNodes.length > 0) {
        minimizedList.classList.add('show');
        videoGrid.classList.add('minimized');
    } else {
        minimizedList.classList.remove('show');
        videoGrid.classList.remove('minimized');
    }
};

window.setFocus = setFocus;

export const computeAudioLevel = (mediaStream, audioBarsRefs) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(mediaStream);
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    const onAudio = () => {
        if (
            !mediaStream.getAudioTracks()[0] ||
            !mediaStream.getAudioTracks()[0].enabled ||
            mediaStream.getAudioTracks()[0].muted ||
            mediaStream.getAudioTracks()[0].readyState === 'ended'
        ) {
            javascriptNode.removeEventListener('audioprocess', onAudio);
            return;
        }

        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;

        const { length } = array.length;
        for (let i = 0; i < length; i + 1) {
            values += array[i];
        }

        const average = values / length;

        audioBarsRefs.forEach((bar, index) => {
            if (bar && bar.current) {
                bar.current.style.height = `${8 +
                    average / (index === 1 ? 2 : 5)}px`;
            }
        });
    };

    javascriptNode.onaudioprocess = onAudio;

    const removeListener = () => {
        javascriptNode.removeEventListener(
            javascriptNode,
            javascriptNode.onaudioprocess,
        );
    };

    return removeListener;
};

export const getInitals = (name = 'Guest') => {
    let firstInitial = 'G';
    let secondInitial = '';
    let formattedName = name;
    formattedName = formattedName.trim().split(' ');

    if (formattedName.length > 0) {
        [[firstInitial]] = formattedName;

        if (formattedName.length > 1) {
            [[, secondInitial]] = formattedName;
        }
    }

    return firstInitial + secondInitial;
};
