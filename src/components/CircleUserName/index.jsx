import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

export const Container = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    background-color: #eddaf1;
    width: 82px;
    height: 82px;
    font-size: 30px;
    border-radius: 100%;
    border: 3px solid #864995;
    color: #292929;

    text-transform: uppercase;
    display: flex;
    justify-content: center;
    align-items: center;
`;

function CircleUserName({ children }) {
    return <Container>{children}</Container>;
}

CircleUserName.propTypes = {
    children: PropTypes.node,
};

export default CircleUserName;
