import React from "react";
import styled, { css } from "styled-components";

import { ReactComponent as CaretDown } from "./../../assets/images/caret-down.svg";

const Caret = styled(CaretDown)`
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    margin: 0px !important;
`;

const Container = styled.button`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: 1px solid rgb(55, 38, 176);
    cursor: pointer;

    text-decoration: none;
    border-radius: 4px;
    margin: ${(props) => (props.margin ? props.margin : "1rem")};
    height: ${(props) => props.height && props.height};
    width: ${(props) => props.width && props.width};
    min-height: ${(props) => props.minHeight && props.minHeight};
    min-width: ${(props) => props.minWidth && props.minWidth};

    font-size: 17px;

    ${(props) =>
        props.disabled &&
        css`
            pointer-events: none;
            opacity: 0.7;
        `}

    & > *:not(:last-child) {
        margin-right: 8px;
    }
    padding: ${(props) =>
        props.padding
            ? props.padding
            : props.prepend || props.append
            ? "0.5rem 1rem"
            : "0.5rem 2rem"};

    ::after {
        content: "";
        width: 20px;
    }

    & > select {
        color: #444;
        background-color: transparent;
        width: 100%;
        height: 100%;
        border: 0px;
        cursor: pointer;
        padding: 0;
        text-align: left;
        appearance: none;
        max-width: 100%;
        text-overflow: ellipsis;
        overflow: hidden;

        &:focus + ${Caret} {
            transform: scaleY(-1) translateY(50%);
        }
    }
`;

const Append = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

function Select({ name, options, placeholder, id, append, prepend, ...props }) {
    return (
        <Container {...props} append={append} prepend={prepend}>
            {prepend && <Append prepend>{prepend}</Append>}

            <select {...props} name={name} id={id} defaultValue={placeholder}>
                {placeholder && (
                    <option value={placeholder} disabled>
                        {placeholder}
                    </option>
                )}
                {options &&
                    options.map((item, index) => (
                        <option
                            key={`${name}_option_${item.value || item}`}
                            value={item.value || item}
                        >
                            {item.label || item}
                        </option>
                    ))}
                {props.children}
            </select>

            <Caret />

            {append && <Append>{append}</Append>}
        </Container>
    );
}

export default Select;
