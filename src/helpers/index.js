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

        const { length } = array;
        for (let i = 0; i < length; i++) {
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

/* eslint-disable */
const mobileBrowser = () => {
    const a = navigator.userAgent || navigator.vendor || window.opera;

    let check = false;
    if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
            a,
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
            a.substr(0, 4),
        )
    )
        check = true;

    return check;
};
/* eslint-enable */

export const isMobileBrowse = mobileBrowser();
