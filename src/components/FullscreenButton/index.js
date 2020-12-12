import React from "react";

import { FaExpand } from "react-icons/fa";
import styled, { css } from "styled-components";

const Container = styled.button`
    position: absolute;
    right: 0px;
    bottom: 0px;
    margin: 10px;
    padding: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    border-radius: 4px;
    border: none;
    font-size: 20px;
    cursor: pointer;
    z-index: 10;

    ${(props) =>
        props.pip &&
        css`
            margin-right: 55px;
        `}

    &.hide {
        display: none;
    }
`;

function FullscreenButton({ handleClick, pip }) {
    return (
        <Container
            pip={pip}
            onClick={handleClick}
            className="fullscreen_button"
        >
            <FaExpand />
        </Container>
    );
}

export default FullscreenButton;
