import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import styled, { css } from "styled-components";
import { Flex } from "../../helpers/styles";

import logo from "../../assets/images/letstalk-logo.png";

const Container = styled(Flex)`
    margin: auto;
    padding-top: 112px;
`;

const Logo = styled.img.attrs(() => ({
    src: logo,
}))`
    position: absolute;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    height: 62px;
`;

const VideoContainer = styled.div`
    width: 700px;
    max-width: 80vw;
    height: 400px;
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    background-color: #444;

    video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: none;
        background-color: transparent;
        margin: 0px;
    }
`;

const NoVideo = styled.div`
    &,
    & > * {
        background-color: transparent;
    }
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;

    color: #fff;
`;

const AudioContainer = styled.div`
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
    border-radius: 10px;

    transition: height 0.025s linear;

    :not(:last-child) {
        margin-right: 4px;
    }

    ${(props) =>
        props.muted &&
        css`
            background-color: #d1d1d1;
        `}
`;

const ControlsContainer = styled.div`
    background-color: transparent;
    position: absolute;
    bottom: 0px;
    left: calc(50%);
    transform: translateX(-50%);
    margin-bottom: 1rem;
    height: 40px;

    display: flex;
    align-items: center;
    justify-content: center;
`;

const MuteButton = styled.button`
    background-color: #fff;
    width: 48px;
    height: 48px;

    border-radius: 100%;
    border: none;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);

    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    :hover {
        opacity: 0.7;
    }

    :not(:last-child) {
        margin-right: 1rem;
    }

    ${(props) =>
        props.muted &&
        css`
            background-color: #fb5555;
            color: #fff;
        `}
`;

const VideoButton = styled(MuteButton)``;

const ContinueButton = styled.button`
    border: none;
    background: rgb(55, 38, 176);
    background: linear-gradient(
        180deg,
        rgba(55, 38, 176, 1) 0%,
        rgba(193, 105, 213, 1) 100%
    );
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    cursor: pointer;

    text-decoration: none;
    padding: 0.5rem 2rem;
    border-radius: 8px;
    margin-top: 1.5rem;
    color: #fff;
    font-size: 17px;
`;

function PreviewPage({ ready, setReady, ...props }) {
    const { room_id } = useParams();
    const { getUserMedia } = navigator.mediaDevices;

    const [currentUserStream, setCurrentUserStream] = useState(undefined);
    const [audioLevel, setAudioLevel] = useState(0);
    const [muted, setMuted] = useState(false);
    const [videoDisabled, setVideoDisabled] = useState(false);

    const audioBarsRefs = [useRef(null), useRef(null), useRef(null)];

    useEffect(() => {
        let userMediaStream;
        const video = document.getElementById("user_video");

        getUserMedia({
            video: true,
            audio: true,
        })
            .then((media_stream) => {
                userMediaStream = media_stream;
                setCurrentUserStream(media_stream);
                setMuted(false);
                setVideoDisabled(false);
                setAudioLevel(0);

                video.muted = true;
                video.srcObject = media_stream;
                video.addEventListener("loadedmetadata", () => {
                    video.play();
                });

                audioLevels(media_stream, setAudioLevel, audioBarsRefs);
            })
            .catch((reason) => alert("Cannot get video because: " + reason));

        return () => {
            userMediaStream &&
                userMediaStream.getTracks().forEach(function (track) {
                    track.stop();
                });
        };

        // eslint-disable-next-line
    }, []);

    const toggleMute = () => {
        currentUserStream.getAudioTracks()[0].enabled = !currentUserStream.getAudioTracks()[0]
            .enabled;

        setMuted(!currentUserStream.getAudioTracks()[0].enabled);
    };

    const toggleVideo = () => {
        currentUserStream.getVideoTracks()[0].enabled = !currentUserStream.getVideoTracks()[0]
            .enabled;

        setVideoDisabled(!currentUserStream.getVideoTracks()[0].enabled);
    };

    const handleEnterRoom = () => {
        setReady(true);
    };

    return (
        <Container direction="column">
            <Logo />

            <VideoContainer>
                {!currentUserStream && (
                    <NoVideo>
                        <h3>Estamos iniciando seu vídeo</h3>
                    </NoVideo>
                )}
                {videoDisabled && (
                    <NoVideo>
                        <h3>Seu vídeo está desligado</h3>
                    </NoVideo>
                )}

                <video id="user_video" />

                {currentUserStream && (
                    <AudioContainer>
                        <AudioBar
                            ref={audioBarsRefs[0]}
                            muted={muted}
                            level={audioLevel}
                        />
                        <AudioBar
                            ref={audioBarsRefs[1]}
                            muted={muted}
                            level={audioLevel}
                        />
                        <AudioBar
                            ref={audioBarsRefs[2]}
                            muted={muted}
                            level={audioLevel}
                        />
                    </AudioContainer>
                )}

                {currentUserStream && (
                    <ControlsContainer>
                        <MuteButton muted={muted} onClick={toggleMute}>
                            M
                        </MuteButton>
                        <VideoButton
                            muted={videoDisabled}
                            onClick={toggleVideo}
                        >
                            V
                        </VideoButton>
                    </ControlsContainer>
                )}
            </VideoContainer>

            <Flex direction="column" margin="30px 0 0 0">
                <Flex margin="0 0 16px 0">
                    <h1>Tudo pronto para conectar?</h1>
                </Flex>
                <p>Sala: {room_id}</p>
                <Flex margin="0 0 16px 0">
                    <ContinueButton onClick={handleEnterRoom}>
                        Entrar no papo
                    </ContinueButton>
                </Flex>
            </Flex>
        </Container>
    );
}

const audioLevels = (media_stream, setAudioLevel, audioBarsRefs) => {
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

        setAudioLevel(average);

        audioBarsRefs.forEach((bar, index) => {
            if (bar && bar.current)
                bar.current.style.height = `${
                    8 + average / (index === 1 ? 2 : 5)
                }px`;
        });
    };
};

export default PreviewPage;
