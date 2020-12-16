import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { lighten } from 'polished';

import { darktheme, Flex } from '../../helpers/styles';

import Logo from '../../components/Logo';
import Button from '../../components/Button';

const Title = styled.h2`
    color: ${lighten(-0.1, darktheme.fontdark)};
`;

function NotFoundPage() {
    return (
        <Flex margin="auto" alignSelf="center" direction="column">
            <Logo />

            <Flex margin="32px 0">
                <Title>
                    Ops, não encontramos o que você está procurando...
                </Title>
            </Flex>

            <Button as={Link} to="/">
                Voltar à tela inicial
            </Button>
        </Flex>
    );
}

export default NotFoundPage;
