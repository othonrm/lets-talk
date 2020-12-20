import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import styled, { css } from 'styled-components';
import { getInitals, isMobileBrowse, setFocus } from '../../helpers';

import AudioLevels from '../AudioLevels';
import FullscreenButton from '../FullscreenButton';
import CircleUserName from '../CircleUserName';

const Container = styled.div`
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

    ${props =>
        props.me &&
        css`
            border: 2px solid #c16bd5;
        `}

    ${props =>
        props.me &&
        props.invert &&
        css`
            & > video {
                transform: scaleX(-1);
            }
        `}

    ${props =>
        props.screen &&
        props.enabled !== true &&
        css`
            display: none;
        `}

    video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border: none;
        background-color: transparent;
        margin: 0px;
        box-sizing: border-box;
        z-index: 1;

        ${null /* eslint-disable */}
        ${props =>
            !props.screen &&
            !props.video &&
            css`
                display: none;
            `}
        ${null /* eslint-enable */}
        
    }

    .user_id {
        display: none;
        pointer-events: none;
    }

    .user_name {
        display: flex;
        align-items: center;
        justify-content: center;
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
        z-index: 1;
    }

    @media screen and (max-width: 760px) {
        max-width: initial;
    }
`;

const CustomAudioLevels = styled(AudioLevels)`
    position: initial;
    padding: 0px;
    margin: 0px;
    max-height: 20px;
    margin-left: 12px;
`;

function VideoContainer({ me, user, mediaStream }) {
    const videoRef = useRef(null);
    const screenVideoRef = useRef(null);

    const [documentFullScreen, setDocumentFullScreen] = useState(false);

    useEffect(() => {
        const handleFullScreenChange = () => {
            if (document.fullscreenElement) {
                setDocumentFullScreen(true);
            } else {
                setDocumentFullScreen(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullScreenChange,
            );
        };

        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        let videoElement = videoRef.current;

        const playVideo = () => {
            videoElement.play();
        };

        if (videoElement) {
            if (me === true) {
                videoElement.muted = true;
            }

            if (mediaStream) {
                videoElement.srcObject = mediaStream;

                if (user && user.audio === true && !user.video) {
                    playVideo();
                }

                videoElement.addEventListener('loadedmetadata', playVideo);
            }
        }

        return () => {
            videoElement &&
                videoElement.removeEventListener('loadedmetadata', playVideo);
        };

        // eslint-disable-next-line
    }, [mediaStream, videoRef]);

    useEffect(() => {
        let screenVideoElement = screenVideoRef.current;

        const playVideo = () => {
            screenVideoElement.play();
        };

        if (screenVideoElement) {
            if (me) {
                screenVideoElement.muted = true;
            }

            if (mediaStream) {
                const screenStream = new MediaStream([
                    mediaStream.getVideoTracks()[1],
                ]);

                screenVideoElement.srcObject = screenStream;

                screenVideoElement.addEventListener(
                    'loadedmetadata',
                    playVideo,
                );
            }
        }

        return () => {
            screenVideoElement &&
                screenVideoElement.removeEventListener(
                    'loadedmetadata',
                    playVideo,
                );
        };

        // eslint-disable-next-line
    }, [mediaStream, screenVideoRef.current]);

    const handleTogglePip = type => {
        if (!user || !user[type]) return;

        if (type === 'video' && videoRef.current) {
            videoRef.current.requestPictureInPicture();
        } else if (type === 'screen' && screenVideoRef.current) {
            screenVideoRef.current.requestPictureInPicture();
        }
    };

    const handleToggleFullScreen = type => {
        if (type === 'video' && videoRef.current) {
            videoRef.current.parentNode.requestFullscreen();
        } else if (type === 'screen' && screenVideoRef.current) {
            screenVideoRef.current.parentNode.requestFullscreen();
        }
    };

    const renderVideoButtons = type => {
        let pipButton;

        if (!isMobileBrowse && !documentFullScreen && user && user[type]) {
            pipButton = (
                <FullscreenButton
                    pip
                    handleClick={() => handleTogglePip(type)}
                />
            );
        }

        let fullscreenButton;

        if (!isMobileBrowse && !documentFullScreen && user && user[type]) {
            fullscreenButton = (
                <FullscreenButton
                    handleClick={() => handleToggleFullScreen(type)}
                />
            );
        }

        return (
            <>
                {pipButton}
                {fullscreenButton}
            </>
        );
    };

    return (
        <>
            <Container
                id={`${user && user.id}_screen`}
                className="video_container screen"
                me={me}
                screen
                enabled={user && user.screen}
                onDoubleClick={() => setFocus(`${user && user.id}_screen`)}
            >
                <video ref={screenVideoRef}></video>
                <div className="user_id">{user && user.id}_screen</div>
                <div className="user_name">
                    {user && user.name} (Compartilhando Tela)
                </div>

                {renderVideoButtons('screen')}
            </Container>

            <Container
                id={user && user.id}
                className="video_container"
                me={me}
                invert={!document.pictureInPictureElement}
                video={user && user.video}
                onDoubleClick={() => setFocus(user && user.id)}
            >
                <CircleUserName>{getInitals(user && user.name)}</CircleUserName>
                <video ref={videoRef}></video>
                <div className="user_id">{user && user.id}</div>
                <div className="user_name">
                    {user && user.name}

                    <CustomAudioLevels
                        muted={user && user.audio !== true}
                        mediaStream={mediaStream}
                    />
                </div>

                {renderVideoButtons('video')}
            </Container>
        </>
    );
}

VideoContainer.propTypes = {
    me: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.objectOf(
            PropTypes.oneOfType([
                PropTypes.func,
                PropTypes.number,
                PropTypes.string,
                PropTypes.bool,
            ]),
        ),
    ]),
    user: PropTypes.objectOf(
        PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.number,
            PropTypes.string,
            PropTypes.bool,
        ]),
    ),
    mediaStream: PropTypes.any,
};

export default VideoContainer;
