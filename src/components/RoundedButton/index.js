import React from "react";
import styled, { css } from "styled-components";

const Container = styled.button`
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

function RoundedButton({ ...props }) {
    return <Container {...props}>{props.children}</Container>;
}

export default RoundedButton;
