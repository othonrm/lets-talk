import React from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { lighten } from 'polished';

import { darkmodeEnabled, darktheme, Flex } from '../../helpers/styles';

import Button from '../../components/Button';
import Logo from '../../components/Logo';

const Title = styled.h2`
    color: ${lighten(-0.1, darktheme.fontdark)};
`;

function RoomLeavePage() {
    const roomId = useParams().room_id;
    const history = useHistory();

    return (
        <Flex margin="auto" alignSelf="center" direction="column">
            <Logo />

            <Flex margin="32px 0">
                <Title>Você encerrou o papo</Title>
            </Flex>

            <Flex>
                <Button
                    outlined
                    margin="0 16px 0 0"
                    onClick={() => history.push(`/${roomId}`)}
                    color={darkmodeEnabled ? darktheme.fontdark : undefined}
                >
                    Voltar ao papo
                </Button>

                <Button as={Link} to="/">
                    Voltar à tela inicial
                </Button>
            </Flex>
        </Flex>
    );
}

export default RoomLeavePage;
