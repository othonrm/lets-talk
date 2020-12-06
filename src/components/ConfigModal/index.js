import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { FaMicrophoneAlt, FaVideo, FaVolumeUp, FaTimes } from "react-icons/fa";

import Select from "../Select";

import enter_room from "../../assets/audios/enter_room.mp3";
import Button from "../Button";
import { Flex } from "../../helpers/styles";

const Backdrop = styled.div`
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 5;
`;

const Container = styled(Flex)`
    background-color: #fff;
    width: 400px;
    max-width: 80vw;
    height: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 1rem;
    border-radius: 10px;
    z-index: 10;
`;

function ConfigModal() {
    const [active, setActive] = useState(false);
    const [mediaDevices, setMediaDevices] = useState([]);
    const [values, setValues] = useState({
        audioinput: localStorage.getItem("audioinput_device") || undefined,
        audiooutput: localStorage.getItem("audiooutput_device") || undefined,
        videoinput: localStorage.getItem("videoinput_device") || undefined,
    });

    useEffect(() => {
        navigator.mediaDevices
            .enumerateDevices()
            .then((device) => {
                setMediaDevices(device);
            })
            .catch((reason) =>
                alert("Cannot get media devices because: " + reason)
            );

        // eslint-disable-next-line
    }, []);

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
        typeof window.onChangeMediaDevices === "function" &&
            window.onChangeMediaDevices();
    };

    const handleTestCurrentOutputDevice = async () => {
        console.log(values.audiooutput);

        const audioEnterRoom = new Audio(enter_room);
        if (values.audiooutput)
            await audioEnterRoom.setSinkId(values.audiooutput);

        audioEnterRoom.play();
    };

    const handleShowModal = () => {
        setActive(true);
    };
    window.showConfigModal = handleShowModal;

    const handleClose = () => {
        setActive(false);
        typeof window.onChangeMediaDevices === "function" &&
            window.onChangeMediaDevices();
    };

    return (
        <>
            {active && mediaDevices && (
                <>
                    <Backdrop />
                    <Container>
                        <Flex width="100%" margin="0 0 20px 0">
                            <Flex margin="0 0 0 auto">
                                <h4>Configurações</h4>
                            </Flex>
                            <Button
                                margin="0 0 0 auto"
                                padding="0"
                                link
                                value={<FaTimes />}
                                onClick={handleClose}
                            />
                        </Flex>
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
                                    <option
                                        key={device.deviceId}
                                        value={device.deviceId}
                                    >
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
                                    <option
                                        key={device.deviceId}
                                        value={device.deviceId}
                                    >
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
                                    <option
                                        key={device.deviceId}
                                        value={device.deviceId}
                                    >
                                        {device.label}
                                    </option>
                                ))}
                        </Select>
                    </Container>
                </>
            )}
        </>
    );
}

export default ConfigModal;
