import React from "react";
import styled, { css } from "styled-components";

const Container = styled.button`
    position: relative;
    background-color: #fff;
    width: 48px;
    height: 48px;
    font-size: 18px;
    border-radius: 100%;
    border: none;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);

    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    :hover {
        opacity: 0.7;
    }

    :not(:last-child) {
        margin-right: 10px;
    }

    ${(props) =>
        props.muted &&
        css`
            background-color: #fb5555;
            color: #fff;
        `}
`;

const Badge = styled.div`
    position: absolute;
    top: 0px;
    right: 0px;
    background-color: #fb5555;
    color: #fff;
    width: 20px;
    height: 20px;
    font-size: 13px;

    transform: translate(25%, -25%);

    border-radius: 100%;
    border: none;

    display: flex;
    align-items: center;
    justify-content: center;

    overflow: hidden;

    ${(props) =>
        props.muted &&
        css`
            background-color: #fff;
            color: #444;
        `}
`;

function RoundedButton({ muted, badge, ...props }) {
    return (
        <Container muted={muted} {...props}>
            {badge && <Badge>{badge}</Badge>}
            {props.children}
        </Container>
    );
}

export default RoundedButton;
