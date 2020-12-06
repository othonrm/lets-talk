import React, { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

const Container = styled.div`
    background-color: transparent;
    position: absolute;
    bottom: 0px;
    left: 0px;
    margin: 1rem;
    height: 40px;

    display: flex;
    align-items: center;
    justify-content: center;
`;

const AudioBar = styled.div`
    background-color: #3ccd39;
    width: 8px;
    border-radius: 10px;

    transition: height 0.025s linear;

    :not(:last-child) {
        margin-right: 4px;
    }

    ${(props) =>
        props.muted &&
        css`
            background-color: #d1d1d1;
            height: 8px !important;
        `}
`;

function AudioLevels({ muted, mediaStream, props }) {
    const audioBarsRefs = [useRef(null), useRef(null), useRef(null)];

    useEffect(() => {
        let _return = audioLevels(mediaStream, audioBarsRefs);

        return () => {
            _return();
        };

        // eslint-disable-next-line
    }, [mediaStream]);

    return (
        <Container>
            <AudioBar ref={audioBarsRefs[0]} muted={muted === true} />
            <AudioBar ref={audioBarsRefs[1]} muted={muted === true} />
            <AudioBar ref={audioBarsRefs[2]} muted={muted === true} />
        </Container>
    );
}

const audioLevels = (media_stream, audioBarsRefs) => {
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

export default AudioLevels;
