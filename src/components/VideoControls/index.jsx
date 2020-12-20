import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {
    FaMicrophoneAlt,
    FaMicrophoneAltSlash,
    FaVideo,
    FaVideoSlash,
    FaDesktop,
    FaSignOutAlt,
    FaLock,
    FaUnlock,
    FaUsers,
} from 'react-icons/fa';

import { darkmodeEnabled, darktheme, Flex } from '../../helpers/styles';
import { replaceSenderTrack, isMobileBrowse } from '../../helpers';

import Button from '../Button';
import RoundedButton from '../RoundedButton';

import newMessageClip from '../../assets/audios/new_message.mp3';
import knocking from '../../assets/audios/knocking.mp3';

function VideoControls({
    user,
    currentUserStream,
    setCurrentUserStream,
    handleLeaveRoom,
    connectedUsers,
}) {
    const { getUserMedia } = navigator.mediaDevices;

    const [socket, setSocket] = useState(window.socket);

    const [audioMuted, setAudioMuted] = useState(
        localStorage.getItem('audio_enabled') === 'false',
    );
    const [videoDisabled, setVideoDisabled] = useState(
        localStorage.getItem('video_enabled') === 'false',
    );

    const [roomLocked, setRoomLocked] = useState(false);
    const [roomOwner, setRoomOwner] = useState(false);

    const [knockRequests, setKnockRequests] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const audiooutput = localStorage.getItem('audiooutput_device');
    const audioNewMessage = new Audio(newMessageClip);
    const audioKnocking = new Audio(knocking);
    audioNewMessage.volume = 0.5;
    audioKnocking.volume = 0.5;

    if (
        audiooutput !== undefined &&
        audiooutput !== null &&
        audiooutput !== ''
    ) {
        audioNewMessage.setSinkId(audiooutput);
        audioKnocking.setSinkId(audiooutput);
    }

    window.onToggleSidePanel = () => {
        setUnreadCount(0);
    };

    window.onReceivedMessage = () => {
        if (!window.sidePanelActive) {
            setUnreadCount(unreadCount + 1);
            audioNewMessage.play();
        }
    };

    useEffect(() => {
        const checkSocket = () => {
            if (window.socket === undefined) {
                setTimeout(checkSocket, 0);
            } else {
                setSocket(window.socket);
            }
        };

        if (socket === undefined) checkSocket();

        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('room-lock', roomLockStatus => {
                setRoomLocked(roomLockStatus);
            });

            socket.on('room-owner', roomOwnerId => {
                setRoomOwner(socket.id === roomOwnerId);
            });

            socket.on('knock-request', (roomId, userName, socketId) => {
                setKnockRequests([...knockRequests, [socketId, userName]]);
            });
        }

        return () => {
            socket && socket.removeAllListeners('room-lock');
            socket && socket.removeAllListeners('room-owner');
            socket && socket.removeAllListeners('knock-request');
        };

        // eslint-disable-next-line
    }, [socket, knockRequests]);

    useEffect(() => {
        if (knockRequests) {
            if (knockRequests.length > 0) {
                audioKnocking.play();
            }

            socket && socket.removeAllListeners('knock-request');

            socket &&
                socket.on('knock-request', (roomId, userName, socketId) => {
                    setKnockRequests([...knockRequests, [socketId, userName]]);
                });
        }

        // eslint-disable-next-line
    }, [knockRequests]);

    const letEnter = socketId => {
        socket.emit('knock-response', socketId);
        setKnockRequests([
            ...knockRequests.filter(item => item[0] !== socketId),
        ]);
    };

    window.letEnter = letEnter;

    const handleRejectRequest = socketId => {
        setKnockRequests([
            ...knockRequests.filter(item => item[0] !== socketId),
        ]);
    };

    const lockRoom = () => {
        socket.emit('lock-room');
    };

    window.lockRoom = lockRoom;

    const toggleMute = () => {
        let enabled;

        if (
            !currentUserStream.getAudioTracks()[0] ||
            !currentUserStream.getAudioTracks()[0].enabled ||
            currentUserStream.getAudioTracks()[0].readyState === 'ended'
        ) {
            getUserMedia({ video: false, audio: true }).then(
                async mediaStream => {
                    const newStream = new MediaStream([
                        mediaStream.getAudioTracks()[0],
                        currentUserStream.getVideoTracks()[0],
                        currentUserStream.getVideoTracks()[1],
                    ]);

                    setCurrentUserStream(newStream);

                    const peerConnections = Object.values({
                        ...connectedUsers,
                    }).reduce((acc, curr) => {
                        return [...acc, curr.peerConnection];
                    }, []);

                    replaceSenderTrack(peerConnections, newStream, 'audio');
                },
            );
            enabled = true;
        } else {
            if (currentUserStream.getAudioTracks()[0]) {
                currentUserStream.getAudioTracks()[0].enabled = false;
                setTimeout(() => {
                    currentUserStream.getAudioTracks()[0].stop();
                }, 500);
            }
            enabled = false;
        }

        setAudioMuted(!enabled);

        localStorage.setItem('audio_enabled', enabled);

        socket.emit('toggle-track', 'audio', enabled);
    };

    window.toggleMute = toggleMute;

    const toggleVideo = () => {
        let enabled;

        if (
            !currentUserStream ||
            !currentUserStream.getVideoTracks()[0] ||
            !currentUserStream.getVideoTracks()[0].enabled ||
            currentUserStream.getVideoTracks()[0].readyState === 'ended'
        ) {
            getUserMedia({ video: true, audio: false }).then(
                async mediaStream => {
                    const newStream = new MediaStream([
                        currentUserStream.getAudioTracks()[0],
                        mediaStream.getVideoTracks()[0],
                        currentUserStream.getVideoTracks()[1],
                    ]);

                    setCurrentUserStream(newStream);

                    const peerConnections = Object.values({
                        ...connectedUsers,
                    }).reduce((acc, curr) => {
                        return [...acc, curr.peerConnection];
                    }, []);

                    replaceSenderTrack(peerConnections, newStream, 'video');
                },
            );
            enabled = true;
        } else {
            if (currentUserStream.getVideoTracks()[0]) {
                currentUserStream.getVideoTracks()[0].enabled = false;
                setTimeout(() => {
                    currentUserStream.getVideoTracks()[0].stop();
                }, 500);
            }
            enabled = false;
        }

        setVideoDisabled(!enabled);

        localStorage.setItem('video_enabled', enabled);

        socket.emit('toggle-track', 'video', enabled);
    };

    window.toggleVideo = toggleVideo;

    return (
        <>
            {knockRequests &&
                roomOwner &&
                knockRequests.map((request, index) => (
                    <KockModal key={request} index={index}>
                        {request[1] || 'Anônimo'}
                        deseja entrar no papo
                        <Flex>
                            <Button
                                onClick={() => letEnter(request[0])}
                                outlined
                                margin="16px 10px 0 0"
                                color={
                                    darkmodeEnabled
                                        ? darktheme.fontdark
                                        : undefined
                                }
                            >
                                Permitir
                            </Button>
                            <Button
                                onClick={() => handleRejectRequest(request[0])}
                                margin="16px 0 0 0"
                            >
                                Negar
                            </Button>
                        </Flex>
                    </KockModal>
                ))}

            <Container>
                <Flex margin="auto">
                    <RoundedButton muted={audioMuted} onClick={toggleMute}>
                        {audioMuted ? (
                            <FaMicrophoneAltSlash />
                        ) : (
                            <FaMicrophoneAlt />
                        )}
                    </RoundedButton>

                    <RoundedButton muted={videoDisabled} onClick={toggleVideo}>
                        {videoDisabled ? <FaVideoSlash /> : <FaVideo />}
                    </RoundedButton>

                    {!isMobileBrowse && (
                        <RoundedButton
                            muted={user && user.screen}
                            onClick={window.screenShare}
                        >
                            <FaDesktop />
                        </RoundedButton>
                    )}

                    {roomOwner && (
                        <RoundedButton onClick={lockRoom}>
                            {roomLocked ? <FaLock /> : <FaUnlock />}
                        </RoundedButton>
                    )}

                    <RoundedButton
                        onClick={window.toggleSidePanel}
                        badge={unreadCount > 0 ? unreadCount : false}
                    >
                        <FaUsers />
                    </RoundedButton>

                    <Flex mobile>
                        <RoundedButton muted onClick={handleLeaveRoom}>
                            <FaSignOutAlt />
                        </RoundedButton>
                    </Flex>
                </Flex>
                <Flex desktop>
                    <LeaveButton onClick={handleLeaveRoom}>
                        <span>Sair</span>
                        <FaSignOutAlt />
                    </LeaveButton>
                </Flex>
            </Container>
        </>
    );
}

const Container = styled.div`
    width: 100%;
    height: 80px;
    max-height: 80px;
    box-sizing: border-box;
    background-color: ${darktheme.primary};
    box-shadow: 0px -3px 6px rgba(0, 0, 0, 0.36);
    z-index: 1;
    flex: 1;

    display: flex;
    justify-content: center;
    align-items: center;

    padding: 1rem;
`;

const KockModal = styled.div`
    position: absolute;
    top: ${props => `${80 + props.index * 120}`}px;
    right: 0;
    background-color: ${darktheme.primary};
    color: ${darktheme.fontdark};
    margin: 10px;
    font-size: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    padding: 14px 10px;
    z-index: 5;
`;

const LeaveButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #d73232;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    border: none;
    cursor: pointer;

    text-decoration: none;
    padding: 0.5rem 2rem;
    border-radius: 8px;
    color: #fff;
    font-size: 17px;

    & > :not(:first-child) {
        margin-left: 8px;
    }
`;

VideoControls.propTypes = {
    user: PropTypes.objectOf(
        PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.number,
            PropTypes.string,
            PropTypes.bool,
        ]),
    ),
    currentUserStream: PropTypes.any,
    setCurrentUserStream: PropTypes.func,
    handleLeaveRoom: PropTypes.func,
    connectedUsers: PropTypes.any,
};

export default VideoControls;
