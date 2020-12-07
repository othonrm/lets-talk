import React from "react";

import { FaExpand } from "react-icons/fa";
import styled from "styled-components";

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

    &.hide {
        display: none;
    }
`;

function FullscreenButton() {
    return (
        <Container className="fullscreen_button">
            <FaExpand />
        </Container>
    );
}

export default FullscreenButton;
