import styled, { createGlobalStyle } from "styled-components";

export const breakpoints = {
    xs: 576,
    mobile: 760,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1400,
};

export var isMobile = window.innerWidth <= breakpoints.mobile;

export const isMobileMediaQuery = `@media screen and (max-width: ${breakpoints.mobile}px)`;
export const notMobileMediaQuery = `@media screen and (min-width: ${
    breakpoints.mobile + 1
}px)`;

export const GlobalStyle = createGlobalStyle`

*, *:active, *:focus {
        outline: none !important;
    }

    *,
    body {
        padding: 0px;
        margin: 0px;
        background-color: rgb(245, 245, 245);

        font-family: 'Roboto', sans-serif;
    }

    html,
    body {
        height: -webkit-fill-available;
    }

    #root {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
    }

    h1 {
        margin-bottom: auto;
    }

`;

export const Flex = styled.div`
    display: flex;
    flex-wrap: ${({ wrap }) => (wrap ? wrap : "wrap")};
    flex-grow: ${({ grow }) => (grow ? grow : "initial")};
    ${({ alignSelf }) => alignSelf && `align-self: ${alignSelf};`};
    ${({ justifySelf }) => justifySelf && `justify-self: ${justifySelf};`};
    align-items: ${({ alignItems }) => (alignItems ? alignItems : "center")};
    justify-content: ${({ justifyContent }) =>
        justifyContent ? justifyContent : "center"};
    ${({ background }) => background && `background: ${background}`};
    ${({ border }) => border && `border: ${border}`};
    ${({ boxShadow }) => boxShadow && `box-shadow: ${boxShadow}`};
    ${({ margin }) => margin && `margin: ${margin}`};
    ${({ padding }) => padding && `padding: ${padding}`};
    ${({ width }) => width && `width: ${width}`};
    ${({ height }) => height && `height: ${height}`};
    ${({ minWidth }) => minWidth && `min-width: ${minWidth}`};
    ${({ maxWidth }) => maxWidth && `max-width: ${maxWidth}`};
    ${({ minHeight }) => minHeight && `min-height: ${minHeight}`};
    ${({ maxHeight }) => maxHeight && `max-height: ${maxHeight}`};
    ${({ position }) => position && `position: ${position}`};
    ${({ zIndex }) => zIndex && `z-index: ${zIndex}`};
    ${({ boxSizing }) => boxSizing && `box-sizing: ${boxSizing}`};
    ${({ flex }) => flex && `flex: ${flex}`};
    ${({ direction }) => direction && `flex-direction: ${direction}`};
    ${({ order }) => order && `order: ${order}`};
    ${({ overflow }) => overflow && `overflow: ${overflow}`};
    ${({ transition }) => transition && `transition: ${transition}`};
    ${({ onClick }) => onClick && "cursor: pointer"};

    ${(props) =>
        props.alignLast &&
        `
        &::after {
            content: "";
            flex: auto;
        }
    `}

    ${(props) =>
        props.desktop &&
        `
        ${isMobileMediaQuery} {
            display:none !important;
        }
    `}

    ${(props) =>
        props.mobile &&
        `
        ${notMobileMediaQuery} {
            display:none !important;
        }
    `}
`;
