import React from "react";
import styled, { css } from "styled-components";

const Container = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(55, 38, 176);
    background: linear-gradient(
        180deg,
        rgba(55, 38, 176, 1) 0%,
        rgba(193, 105, 213, 1) 100%
    );
    border: none;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    cursor: pointer;

    text-decoration: none;
    border-radius: 4px;
    margin: ${(props) => (props.margin ? props.margin : "1rem")};
    padding: ${(props) => (props.padding ? props.padding : "0.5rem 2rem")};
    height: ${(props) => props.height && props.height};
    width: ${(props) => props.width && props.width};
    min-height: ${(props) => props.minHeight && props.minHeight};
    min-width: ${(props) => props.minWidth && props.minWidth};
    color: #fff;
    font-size: 17px;

    ${(props) =>
        props.outlined &&
        css`
            background: transparent;
            border: 1px solid rgb(55, 38, 176);
            color: rgb(55, 38, 176);
        `}

    ${(props) =>
        props.link &&
        css`
            background: transparent;
            color: rgb(55, 38, 176);
            box-shadow: none;
        `}

    ${(props) =>
        props.disabled &&
        css`
            pointer-events: none;
            opacity: 0.7;
        `}

    & > *:not(:last-child) {
        margin-right: 8px;
    }
`;

function Button({ ...props }) {
    return <Container {...props}>{props.children}</Container>;
}

export default Button;
