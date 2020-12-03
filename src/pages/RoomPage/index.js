import React, { useState } from "react";
import styled from "styled-components";

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

    & > div {
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
    }

    video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: none;
        background-color: transparent;
        margin: 0px;
        box-sizing: border-box;
    }
`;

const VideoControls = styled.div`
    width: 100%;
    height: 80px;
`;

function RoomPage() {
    const [ready, setReady] = useState(!false);

    return (
        <>
            {ready ? (
                <>
                    <Logo />

                    <Connection />

                    <Container>
                        <VideoGrid />

                        <VideoControls />
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
