import React, { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import { computeAudioLevel } from "../../helpers";

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
    height: 8px;
    max-height: 100%;
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

function AudioLevels({ muted, mediaStream, className, ...props }) {
    const audioBarsRefs = [useRef(null), useRef(null), useRef(null)];

    useEffect(() => {
        let removeListener;

        if (!muted && mediaStream && mediaStream.getAudioTracks().length > 0) {
            removeListener = computeAudioLevel(mediaStream, audioBarsRefs);
        }

        return () => {
            removeListener && removeListener();
        };

        // eslint-disable-next-line
    }, [mediaStream, muted]);

    return (
        <Container className={[className, "audio_level"].join(" ")} {...props}>
            <AudioBar
                className="audio_bar"
                ref={audioBarsRefs[0]}
                muted={muted === true}
            />
            <AudioBar
                className="audio_bar"
                ref={audioBarsRefs[1]}
                muted={muted === true}
            />
            <AudioBar
                className="audio_bar"
                ref={audioBarsRefs[2]}
                muted={muted === true}
            />
        </Container>
    );
}

export default AudioLevels;
