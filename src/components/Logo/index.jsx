import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import logo from '../../assets/images/letstalk-logo.png';

const Container = styled.img.attrs(() => ({
    src: logo,
}))`
    width: ${props => props.width && props.width};
    height: ${props => (props.height ? props.height : '82px')};
`;

function Logo({ width, height }) {
    return <Container width={width} height={height} />;
}

Logo.propTypes = {
    width: PropTypes.any,
    height: PropTypes.any,
};

export default Logo;
