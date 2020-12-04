import React, { useState } from "react";
import styled, { css } from "styled-components";

import Connection from "../../services/connection";
// import "../../services/old_connection";
import PreviewPage from "../PreviewPage";

import logo from "../../assets/images/letstalk-logo.png";
import { Flex } from "../../helpers/styles";

const Logo = styled.img.attrs(() => ({
    src: logo,
}))`
    position: absolute;
    top: 1rem;
    left: 1rem;
    height: 42px;
`;

const Container = styled(Flex)`
    width: 100vw;
    height: calc(100vh - 80px);
    margin-top: 80px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    overflow: hidden;
    background-color: #000;
`;

const VideoGrid = styled(Flex).attrs(() => ({
    id: "video_grid",
}))`
    position: relative;
    height: 100%;
    width: 100%;
    flex: 1;
    overflow: hidden;
    padding: 30px;
    box-sizing: border-box;
    background-color: #444;
    background: rgb(92 56 185 / 0.7);
    background: linear-gradient(
        180deg,
        rgba(55, 38, 176, 0.7) 0%,
        rgba(193, 105, 213, 0.7) 100%
    );

    display: grid;
    grid-gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(calc(25% - 60px), 1fr));

    @media screen and (max-width: 1222px) {
        grid-template-columns: repeat(auto-fit, minmax(calc(30% - 60px), 1fr));
    }

    @media screen and (max-width: 760px) {
        grid-template-columns: repeat(auto-fit, minmax(calc(48% - 60px), 1fr));
    }

    &.minimized {
        padding-right: 300px;

        & > .video_container {
            max-width: 100%;
            max-height: 100%;
        }
    }

    .video_container {
        position: relative;
        margin: auto;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        max-height: 60vw;
        max-width: 60vw;
        border-radius: 10px;
        box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.36);
        cursor: pointer;
        background-color: #111;

        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border: none;
            background-color: transparent;
            margin: 0px;
            box-sizing: border-box;
            pointer-events: none;
        }

        .user_id {
            display: none;
            pointer-events: none;
        }

        .user_name {
            position: absolute;
            bottom: 0px;
            margin: 10px;
            left: 0px;
            background-color: rgb(0 0 0 / 58%);
            color: #fff;
            padding: 6px;
            text-transform: capitalize;
            border-radius: 6px;
            pointer-events: none;
        }
    }
`;

const MinimizedVideoList = styled.div.attrs(() => ({
    id: "minimized_list",
}))`
    background-color: transparent;
    position: absolute;
    top: 0px;
    bottom: 0px;
    right: 0px;
    box-sizing: border-box;

    width: 0px;
    display: flex;
    flex-direction: column;

    &.show {
        width: 300px;
        padding: 1rem;
    }

    .video_container {
        max-width: 100%;
        max-height: 200px;
    }
`;

function RoomPage() {
    const [ready, setReady] = useState(false);
    const [disconnected, setDisconnected] = useState(false);

    const handleLeaveRoom = () => {
        setReady(false);
        setDisconnected(true);

        window.leaveRoom();
    };

    return (
        <>
            {ready === true ? (
                <>
                    <Logo />

                    <Container>
                        <VideoGrid>
                            <MinimizedVideoList />
                        </VideoGrid>

                        <Connection handleLeaveRoom={handleLeaveRoom} />
                    </Container>
                </>
            ) : (
                <>
                    <PreviewPage ready={ready} setReady={setReady} />
                </>
            )}
        </>
    );
}

export default RoomPage;
