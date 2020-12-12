import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

import styled from "styled-components";
import { darkmodeEnabled, darktheme, Flex } from "../../helpers/styles";

import {
    FaMicrophoneAlt,
    FaMicrophoneAltSlash,
    FaVideo,
    FaVideoSlash,
    FaCog,
} from "react-icons/fa";

import RoundedButton from "../../components/RoundedButton";
import Button from "../../components/Button";
import AudioLevels from "../../components/AudioLevels";

import logo from "../../assets/images/letstalk-logo.png";
import { lighten } from "polished";
import { dummyAudioTrack, dummyVideoTrack } from "../../helpers";

const Container = styled(Flex)`
    margin: auto;
    padding-top: 112px;
`;

const HeaderLogo = styled.img.attrs(() => ({
    src: logo,
    height: "62px",
}))`
    position: absolute;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
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
        color: #fff;
    }
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
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

const Title = styled.h1`
    color: ${lighten(-0.1, darktheme.fontdark)};
`;

const Text = styled.p`
    color: ${lighten(-0.1, darktheme.fontdark)};
`;

const TextInput = styled.input`
    font-size: 18px;
    padding: 8px 16px;
    background-color: transparent;
    border: none;
    border-bottom: 2px solid ${lighten(-0.5, darktheme.fontdark)};
    color: ${darkmodeEnabled && darktheme.fontdark};
    width: 320px;
`;

let socket;

const connectSocket = (handleEnterRoom) => {
    socket = io(
        process.env.NODE_ENV === "development" ? "localhost:8080" : "/"
    );

    socket.on("allowed-to-enter", (allowed, pass) => {
        if (pass !== undefined) {
            localStorage.setItem(`locked_room_pass`, pass);
        } else {
            localStorage.removeItem(`locked_room_pass`);
        }

        if (allowed) {
            handleEnterRoom();
        }
    });
};

function PreviewPage({ ready, setReady, ...props }) {
    const { room_id } = useParams();
    const { getUserMedia } = navigator.mediaDevices;

    const skipPreview =
        localStorage.getItem("skip_" + room_id) === "true" &&
        (localStorage.getItem("user_name") || "").length > 0;

    const [currentUserStream, setCurrentUserStream] = useState(undefined);
    const [audioMuted, setAudioMuted] = useState(
        localStorage.getItem("audio_enabled") === "false" ? true : false
    );
    const [videoDisabled, setVideoDisabled] = useState(
        localStorage.getItem("video_enabled") === "false" ? true : false
    );
    const [name, setName] = useState(localStorage.user_name || "");
    const [knocking, setKnocking] = useState(false);

    useEffect(() => {
        connectSocket(handleEnterRoom);

        if (skipPreview) {
            knockRoom();
        } else {
            handleGetUserStream();
        }

        return () => {
            socket && socket.destroy();

            currentUserStream &&
                currentUserStream.getTracks().forEach(function (track) {
                    track.stop();
                });
        };

        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const video = document.getElementById("user_video");

        if (currentUserStream && video) {
            video.srcObject = currentUserStream;
            video.addEventListener("loadedmetadata", () => {
                video.play();
            });
        }

        // eslint-disable-next-line
    }, [currentUserStream]);

    window.onChangeMediaDevices = () => {
        stopMediaTracks();
    };

    const handleGetUserStream = async () => {
        const video = document.getElementById("user_video");

        if (!video) return;

        video.style.transform = "scaleX(-1)";
        video.muted = true;

        let audioinput = localStorage.getItem("audioinput_device") || undefined;
        let audiooutput =
            localStorage.getItem("audiooutput_device") || undefined;
        let videoinput = localStorage.getItem("videoinput_device") || undefined;

        let constraints = {
            video: videoinput ? { deviceId: videoinput } : !videoDisabled,
            audio: audioinput ? { deviceId: audioinput } : !audioMuted,
        };

        if (!constraints.audio && !constraints.video) {
            let audioTrack = dummyAudioTrack();
            audioTrack.stop();

            let videoTrack = dummyVideoTrack();
            videoTrack.stop();

            const mediaStream = new MediaStream([audioTrack, videoTrack]);
            setCurrentUserStream(mediaStream);

            if (audiooutput) await video.setSinkId(audiooutput);

            video.srcObject = mediaStream;
            video.addEventListener("loadedmetadata", () => {
                video.play();
            });
        } else
            getUserMedia(constraints)
                .then(async (media_stream) => {
                    let audio_enabled = localStorage.getItem("audio_enabled");
                    let video_enabled = localStorage.getItem("video_enabled");

                    if (
                        (audio_enabled === "true" ||
                            audio_enabled === "false") &&
                        media_stream.getAudioTracks()[0]
                    ) {
                        media_stream.getAudioTracks()[0].enabled =
                            audio_enabled === "true" ? true : false;
                    }
                    if (
                        (video_enabled === "true" ||
                            video_enabled === "false") &&
                        media_stream.getVideoTracks()[0]
                    ) {
                        media_stream.getVideoTracks()[0].enabled =
                            video_enabled === "true" ? true : false;
                    }

                    setCurrentUserStream(media_stream);

                    if (audiooutput) await video.setSinkId(audiooutput);

                    video.srcObject = media_stream;
                    video.addEventListener("loadedmetadata", () => {
                        video.play();
                    });
                })
                .catch((reason) =>
                    alert("Cannot get video because: " + reason)
                );
    };

    const handleChangeName = (e) => {
        let tempName = e.target.value.replace(
            /(?:(?![0-9a-zA-zàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð |,.'-]).)+/g,
            ""
        );
        if (tempName === " ") tempName = "";
        setName(tempName);
        localStorage.setItem("user_name", tempName.trim());
    };

    const toggleMute = () => {
        let enabled;

        if (
            !currentUserStream.getAudioTracks()[0] ||
            !currentUserStream.getAudioTracks()[0].enabled ||
            currentUserStream.getAudioTracks()[0].readyState === "ended"
        ) {
            getUserMedia({ video: false, audio: true }).then(
                async (media_stream) => {
                    setCurrentUserStream(
                        new MediaStream([
                            media_stream.getAudioTracks()[0],
                            currentUserStream.getVideoTracks()[0] ||
                                dummyVideoTrack(),
                        ])
                    );
                }
            );
            enabled = true;
        } else {
            currentUserStream.getAudioTracks().forEach((track) => {
                track.enabled = false;
                track.stop();
                currentUserStream.removeTrack(track);
            });
            enabled = false;
        }

        setAudioMuted(!enabled);

        localStorage.setItem("audio_enabled", enabled);
    };

    const toggleVideo = () => {
        let enabled;

        if (
            !currentUserStream ||
            !currentUserStream.getVideoTracks()[0] ||
            !currentUserStream.getVideoTracks()[0].enabled ||
            currentUserStream.getVideoTracks()[0].readyState === "ended"
        ) {
            getUserMedia({ video: true, audio: false }).then(
                async (media_stream) => {
                    setCurrentUserStream(
                        new MediaStream([
                            currentUserStream.getAudioTracks()[0] ||
                                dummyAudioTrack(),
                            media_stream.getVideoTracks()[0],
                        ])
                    );
                }
            );
            enabled = true;
        } else {
            currentUserStream.getVideoTracks().forEach((track) => {
                track.enabled = false;
                track.stop();
                currentUserStream.removeTrack(track);
            });
            enabled = false;
        }

        setVideoDisabled(!enabled);

        localStorage.setItem("video_enabled", enabled);
    };

    const checkNameValidity = () => {
        return name.match(
            /^[0-9a-zA-zàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð |,.'-]+$/g
        );
    };

    const knockRoom = () => {
        setKnocking(true);

        socket.emit("knock-room", room_id, name === "" ? "Guest" : name);
    };

    window.knockRoom = knockRoom;

    const stopMediaTracks = () => {
        currentUserStream &&
            currentUserStream.getTracks().forEach((track) => {
                track.stop();
            });

        handleGetUserStream();
    };

    const handleRequestToEnter = () => {
        if (
            (!name ||
                name.toString().trim().length === 0 ||
                !checkNameValidity()) &&
            name !== ""
        )
            return;

        knockRoom();
    };

    const handleEnterRoom = () => {
        setReady(true);
    };

    window.handleEnterRoom = handleEnterRoom;

    const handleGiveUpKnocking = () => {
        if (skipPreview) {
            localStorage.removeItem("skip_" + room_id);
        }

        window.location.reload();
    };

    return (
        <Container direction="column">
            <HeaderLogo />

            {!skipPreview && (
                <VideoContainer>
                    {currentUserStream === undefined && (
                        <NoVideo>
                            <h3>Estamos iniciando seu vídeo</h3>
                        </NoVideo>
                    )}
                    {currentUserStream !== undefined && videoDisabled && (
                        <NoVideo>
                            <h3>Seu vídeo está desligado</h3>
                        </NoVideo>
                    )}

                    <video id="user_video" />

                    {currentUserStream !== undefined && (
                        <AudioLevels
                            muted={audioMuted}
                            mediaStream={currentUserStream}
                        />
                    )}

                    {currentUserStream !== undefined && (
                        <ControlsContainer>
                            <RoundedButton
                                muted={audioMuted}
                                onClick={toggleMute}
                            >
                                {audioMuted ? (
                                    <FaMicrophoneAltSlash />
                                ) : (
                                    <FaMicrophoneAlt />
                                )}
                            </RoundedButton>
                            <RoundedButton
                                muted={videoDisabled}
                                onClick={toggleVideo}
                            >
                                {videoDisabled ? <FaVideoSlash /> : <FaVideo />}
                            </RoundedButton>
                            <RoundedButton
                                onClick={() => window.showConfigModal()}
                            >
                                <FaCog />
                            </RoundedButton>
                        </ControlsContainer>
                    )}
                </VideoContainer>
            )}

            {!knocking ? (
                <>
                    <Flex direction="column" margin="30px 0 0 0">
                        <Flex margin="0 0 16px 0">
                            <Title>Tudo pronto para conectar?</Title>
                        </Flex>
                        <Text>Sala: {room_id}</Text>

                        <Flex direction="column" margin="32px 0 10px 0">
                            <TextInput
                                name="user_name"
                                value={name}
                                onChange={(e) => handleChangeName(e)}
                                placeholder="Digite seu nome"
                                pattern="[a-zA-Z]"
                            />
                        </Flex>

                        <Flex direction="column" margin="10px 0 32px 0">
                            <Text as="label">
                                <input
                                    type="checkbox"
                                    name="skip"
                                    defaultChecked={
                                        localStorage.getItem(
                                            "skip_" + room_id
                                        ) === "true"
                                    }
                                    onChange={(e) =>
                                        localStorage.setItem(
                                            "skip_" + room_id,
                                            e.target.checked
                                        )
                                    }
                                />
                                Pular próxima entrada nesta sala
                            </Text>
                        </Flex>

                        <Flex margin="0 0 16px 0">
                            <Button
                                disabled={!checkNameValidity() && name !== ""}
                                onClick={handleRequestToEnter}
                            >
                                Entrar no papo
                            </Button>
                        </Flex>
                    </Flex>
                </>
            ) : (
                <>
                    <Flex direction="column" margin="30px 0 0 0">
                        <Flex margin="0 0 16px 0">
                            <Title>
                                Estamos avisando o pessoal que você quer entrar
                                no papo
                            </Title>
                        </Flex>
                        <Text>
                            Aguarde alguém aprovar sua entrada, não é legal
                            atravessar a conversa de ninguém...
                        </Text>

                        <Flex margin="0 0 16px 0">
                            <Button onClick={handleGiveUpKnocking}>
                                Desistir
                            </Button>
                        </Flex>
                    </Flex>
                </>
            )}
        </Container>
    );
}

export default PreviewPage;
