import React from "react";
import styled from "styled-components";

import logo from "../../assets/images/letstalk-logo.png";

const Container = styled.img.attrs(() => ({
    src: logo,
}))`
    width: ${(props) => props.width && props.width};
    height: ${(props) => (props.height ? props.height : "82px")};
`;

function Logo({ width, height, ...props }) {
    return <Container width={width} height={height} />;
}

export default Logo;
