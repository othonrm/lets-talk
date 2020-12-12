import React, { useState } from "react";
import styled from "styled-components";

import { FaCog } from "react-icons/fa";

import Connection from "../../services/connection";
import PreviewPage from "../PreviewPage";

import { Flex } from "../../helpers/styles";
import SidePanel from "../../components/SidePanel";
import ConfigModal from "../../components/ConfigModal";
import { default as Rounded } from "../../components/RoundedButton";

import logo from "../../assets/images/letstalk-logo.png";
import VideoContainer from "../../components/VideoContainer";
import VideoControls from "../../components/VideoControls";

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
    transition: width 0.2s ease-in-out;

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

        @media screen and (max-width: 760px) {
            padding-right: 30px;
            padding-bottom: 210px;
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
    justify-content: center;

    &.show {
        width: 300px;
        padding: 1rem;

        @media screen and (max-width: 760px) {
            top: initial;
            height: 200px;
            left: 0px;
            right: 0px;
            flex-wrap: nowrap;
            width: 100%;
            right: initial;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
        }
    }

    .video_container {
        max-width: 100%;
        max-height: 200px;
        height: auto;
        margin: 0;

        :not(:last-of-type) {
            margin-bottom: 10px;
        }

        @media screen and (max-width: 760px) {
            width: 280px;
            min-width: 280px;

            :not(:last-child) {
                margin-bottom: 0px;
                margin-right: 10px;
            }
        }
    }

    @media screen and (max-width: 760px) {
        justify-content: flex-start;
    }
`;

const RoundedButton = styled(Rounded)`
    position: absolute;
    top: 0px;
    right: 0px;
    margin: 10px !important;
    z-index: 5;
`;

function RoomPage() {
    const [ready, setReady] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState({});
    const [roomMembers, setRoomMembers] = useState([]);
    const [currentUserStream, setCurrentUserStream] = useState(undefined);
    const [myId, setMyId] = useState(undefined);

    const handleLeaveRoom = () => {
        // setReady(false);

        window.leaveRoom();
    };

    return (
        <>
            <ConfigModal />

            {ready === true ? (
                <>
                    <Logo />

                    <Container>
                        <Flex
                            position="relative"
                            height="calc(100% - 80px)"
                            flex="1"
                            width="100%"
                        >
                            <VideoGrid>
                                <MinimizedVideoList />
                                <RoundedButton
                                    onClick={() => window.showConfigModal()}
                                >
                                    <FaCog />
                                </RoundedButton>

                                {currentUserStream && myId && (
                                    <VideoContainer
                                        me
                                        user={roomMembers.find(
                                            (member) => member.id === myId
                                        )}
                                        mediaStream={currentUserStream}
                                    />
                                )}

                                {connectedUsers &&
                                    Object.values(connectedUsers).map(
                                        (user) => {
                                            if (!user) return null;

                                            const currentRoomMember = roomMembers.find(
                                                (member) =>
                                                    member.id === user.peer
                                            );
                                            return (
                                                currentRoomMember && (
                                                    <VideoContainer
                                                        key={user.peer}
                                                        user={currentRoomMember}
                                                        mediaStream={
                                                            user.remoteStream
                                                        }
                                                    />
                                                )
                                            );
                                        }
                                    )}
                            </VideoGrid>

                            <SidePanel
                                roomMembers={roomMembers}
                                setRoomMembers={setRoomMembers}
                            />
                        </Flex>

                        <VideoControls
                            user={roomMembers.find(
                                (member) => member.id === myId
                            )}
                            currentUserStream={currentUserStream}
                            setCurrentUserStream={setCurrentUserStream}
                            handleLeaveRoom={handleLeaveRoom}
                            connectedUsers={connectedUsers}
                        />

                        <Connection
                            myId={myId}
                            setMyId={setMyId}
                            currentUserStream={currentUserStream}
                            setCurrentUserStream={setCurrentUserStream}
                            connectedUsers={connectedUsers}
                            setConnectedUsers={setConnectedUsers}
                            handleLeaveRoom={handleLeaveRoom}
                        />
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
