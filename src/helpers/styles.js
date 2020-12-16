import styled, { createGlobalStyle } from 'styled-components';

export const breakpoints = {
    xs: 576,
    mobile: 760,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1400,
};

export const colors = {
    lightcolor: '#eee',
    lightercolor: '#fff',
    darkcolor: '#2f2f2f',
    darkercolor: '#292929',
};

export const darkmodeEnabled = window.matchMedia('(prefers-color-scheme: dark)')
    .matches;

export const darktheme = {
    primary: darkmodeEnabled ? colors.darkcolor : colors.lightercolor,
    secondary: darkmodeEnabled ? colors.darkercolor : colors.lightcolor,
    fontlight: darkmodeEnabled ? '#444' : '#fff',
    fontdark: darkmodeEnabled ? '#fff' : '#444',
};

export const isMobile = window.innerWidth <= breakpoints.mobile;

export const isMobileMediaQuery = `@media screen and (max-width: ${breakpoints.mobile}px)`;
export const notMobileMediaQuery = `@media screen and (min-width: ${breakpoints.mobile +
    1}px)`;

export const GlobalStyle = createGlobalStyle`

*, *:active, *:focus {
        outline: none !important;
    }

    *,
    body {
        padding: 0px;
        margin: 0px;

        font-family: 'Roboto', sans-serif;
    }

    html,
    body {
        height: -webkit-fill-available;
        background-color: ${darktheme.primary};
    }

    #root {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
    }

    h1, h2, h3, h4, h5 {
        color: #444;
        text-align: center;
    }

`;

export const Flex = styled.div`
    display: ${({ display }) => display || 'flex'};
    flex-wrap: ${({ wrap }) => wrap || 'wrap'};
    flex-grow: ${({ grow }) => grow || 'initial'};
    ${({ alignSelf }) => alignSelf && `align-self: ${alignSelf};`};
    ${({ justifySelf }) => justifySelf && `justify-self: ${justifySelf};`};
    align-items: ${({ alignItems }) => alignItems || 'center'};
    justify-content: ${({ justifyContent }) => justifyContent || 'center'};
    ${({ background }) => background && `background: ${background}`};
    ${({ color }) => color && `color: ${color}`};
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
    ${({ onClick }) => onClick && 'cursor: pointer'};

    ${props =>
        props.alignLast &&
        `
        &::after {
            content: "";
            flex: auto;
        }
    `}

    ${props =>
        props.desktop &&
        `
        ${isMobileMediaQuery} {
            display:none !important;
        }
    `}

    ${props =>
        props.mobile &&
        `
        ${notMobileMediaQuery} {
            display:none !important;
        }
    `}
`;
