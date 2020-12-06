import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

import styled from "styled-components";
import { Flex } from "../../helpers/styles";

import {
    FaMicrophoneAlt,
    FaMicrophoneAltSlash,
    FaVideo,
    FaVideoSlash,
    FaVolumeUp,
    FaCog,
} from "react-icons/fa";

import RoundedButton from "../../components/RoundedButton";
import Button from "../../components/Button";
import AudioLevels from "../../components/AudioLevels";
import Select from "../../components/Select";

import enter_room from "../../assets/audios/enter_room.mp3";
import logo from "../../assets/images/letstalk-logo.png";

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

const TextInput = styled.input`
    font-size: 18px;
    padding: 8px 16px;
    /* border-radius: 6px; */
    background-color: transparent;
    border: none;
    border-bottom: 2px solid #333;
    width: 320px;
`;

let socket;

const connectSocket = (handleEnterRoom) => {
    socket = io(
        process.env.NODE_ENV === "development" ? "localhost:8080" : "/"
    );

    socket.on("allowed-to-enter", (allowed, pass) => {
        console.log("allowed-to-enter: " + allowed, pass);

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
    const [values, setValues] = useState({
        audioinput: localStorage.getItem("audioinput_device") || undefined,
        audiooutput: localStorage.getItem("audiooutput_device") || undefined,
        videoinput: localStorage.getItem("videoinput_device") || undefined,
    });
    const [showDeviceConfig, setShowDeviceConfig] = useState(false);

    const [mediaDevices, setMediaDevices] = useState([]);

    useEffect(() => {
        connectSocket(handleEnterRoom);

        if (skipPreview) {
            knockRoom();
        } else {
            handleGetUserStream();

            navigator.mediaDevices
                .enumerateDevices()
                .then((device) => {
                    setMediaDevices(device);
                })
                .catch((reason) =>
                    alert("Cannot get video because: " + reason)
                );
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
        stopMediaTracks();

        // eslint-disable-next-line
    }, [values]);

    const handleGetUserStream = () => {
        const video = document.getElementById("user_video");

        if (!video) return;

        video.style.transform = "scaleX(-1)";
        video.muted = true;

        let constraints = {
            video: values.videoinput ? { deviceId: values.videoinput } : true,
            audio: values.audioinput ? { deviceId: values.audioinput } : true,
        };

        getUserMedia(constraints)
            .then(async (media_stream) => {
                let audio_enabled = localStorage.getItem("audio_enabled");
                let video_enabled = localStorage.getItem("video_enabled");

                if (audio_enabled === "true" || audio_enabled === "false") {
                    media_stream.getAudioTracks()[0].enabled =
                        audio_enabled === "true" ? true : false;
                }
                if (video_enabled === "true" || video_enabled === "false") {
                    media_stream.getVideoTracks()[0].enabled =
                        video_enabled === "true" ? true : false;
                }

                setCurrentUserStream(media_stream);

                if (values.audiooutput)
                    await video.setSinkId(values.audiooutput);

                video.srcObject = media_stream;
                video.addEventListener("loadedmetadata", () => {
                    video.play();
                });
            })
            .catch((reason) => alert("Cannot get video because: " + reason));
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

    const handleChange = (e) => {
        setValues({
            ...values,
            [e.target.name]: e.target.value,
        });

        if (e.target.name === "audioinput") {
            localStorage.setItem("audioinput_device", e.target.value);
        } else if (e.target.name === "audiooutput") {
            localStorage.setItem("audiooutput_device", e.target.value);
        } else if (e.target.name === "videoinput") {
            localStorage.setItem("videoinput_device", e.target.value);
        }
    };

    const toggleMute = () => {
        currentUserStream.getAudioTracks()[0].enabled = !currentUserStream.getAudioTracks()[0]
            .enabled;

        setAudioMuted(!currentUserStream.getAudioTracks()[0].enabled);

        localStorage.setItem(
            "audio_enabled",
            currentUserStream.getAudioTracks()[0].enabled
        );
    };

    const toggleVideo = () => {
        currentUserStream.getVideoTracks()[0].enabled = !currentUserStream.getVideoTracks()[0]
            .enabled;

        setVideoDisabled(!currentUserStream.getVideoTracks()[0].enabled);

        localStorage.setItem(
            "video_enabled",
            currentUserStream.getVideoTracks()[0].enabled
        );
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

        handleGetUserStream(null, document.getElementById("user_video"));
    };

    const handleTestCurrentOutputDevice = async () => {
        console.log(values.audiooutput);

        const audioEnterRoom = new Audio(enter_room);
        if (values.audiooutput)
            await audioEnterRoom.setSinkId(values.audiooutput);

        audioEnterRoom.play();
    };

    const handleRequestToEnter = () => {
        console.log(name !== "");
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
                    {!currentUserStream && (
                        <NoVideo>
                            <h3>Estamos iniciando seu vídeo</h3>
                        </NoVideo>
                    )}
                    {currentUserStream && videoDisabled && (
                        <NoVideo>
                            <h3>Seu vídeo está desligado</h3>
                        </NoVideo>
                    )}

                    <video id="user_video" />

                    {currentUserStream && (
                        <AudioLevels
                            muted={audioMuted}
                            mediaStream={currentUserStream}
                        />
                    )}

                    {currentUserStream && (
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
                                onClick={() =>
                                    setShowDeviceConfig(!showDeviceConfig)
                                }
                            >
                                <FaCog />
                            </RoundedButton>
                        </ControlsContainer>
                    )}
                </VideoContainer>
            )}

            {mediaDevices && showDeviceConfig && (
                <>
                    <Select
                        width="300px"
                        prepend={<FaMicrophoneAlt />}
                        name="audioinput"
                        value={values.audioinput}
                        onChange={handleChange}
                    >
                        {mediaDevices
                            .filter((item) => item.kind === "audioinput")
                            .map((device) => (
                                <option value={device.deviceId}>
                                    {device.label}
                                </option>
                            ))}
                    </Select>

                    <Select
                        width="300px"
                        prepend={<FaVolumeUp />}
                        append={
                            <Button
                                small
                                link
                                value="Testar"
                                padding="0"
                                margin="0"
                                onClick={handleTestCurrentOutputDevice}
                            />
                        }
                        name="audiooutput"
                        value={values.audiooutput}
                        onChange={handleChange}
                    >
                        {mediaDevices
                            .filter((item) => item.kind === "audiooutput")
                            .map((device) => (
                                <option value={device.deviceId}>
                                    {device.label}
                                </option>
                            ))}
                    </Select>

                    <Select
                        width="300px"
                        prepend={<FaVideo />}
                        name="videoinput"
                        value={values.videoinput}
                        onChange={handleChange}
                    >
                        {mediaDevices
                            .filter((item) => item.kind === "videoinput")
                            .map((device) => (
                                <option value={device.deviceId}>
                                    {device.label}
                                </option>
                            ))}
                    </Select>
                </>
            )}

            {!showDeviceConfig &&
                (!knocking ? (
                    <>
                        <Flex direction="column" margin="30px 0 0 0">
                            <Flex margin="0 0 16px 0">
                                <h1>Tudo pronto para conectar?</h1>
                            </Flex>
                            <p>Sala: {room_id}</p>

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
                                <label>
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
                                </label>
                            </Flex>

                            <Flex margin="0 0 16px 0">
                                <Button
                                    disabled={
                                        !checkNameValidity() && name !== ""
                                    }
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
                                <h1>
                                    Estamos avisando o pessoal que você quer
                                    entrar no papo
                                </h1>
                            </Flex>
                            <p>
                                Aguarde alguém aprovar sua entrada, não é legal
                                atravessar a conversa de ninguém...
                            </p>

                            <Flex margin="0 0 16px 0">
                                <Button onClick={handleGiveUpKnocking}>
                                    Desistir
                                </Button>
                            </Flex>
                        </Flex>
                    </>
                ))}
        </Container>
    );
}

export default PreviewPage;
