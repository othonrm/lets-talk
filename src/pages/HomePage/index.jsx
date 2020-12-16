import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import { FaVideo } from 'react-icons/fa';

import { lighten } from 'polished';
import { darkmodeEnabled, darktheme, Flex } from '../../helpers/styles';

import Button from '../../components/Button';

import logo from '../../assets/images/letstalk-logo.png';
import peopleGrid from '../../assets/images/people_grid.png';

const HeaderLogo = styled.img.attrs(() => ({
    src: logo,
    height: '62px',
}))`
    position: absolute;
    top: 1rem;
    left: 1rem;
    height: 42px;
`;

const Container = styled(Flex)`
    h1,
    h3 {
        text-align: left;
        margin-bottom: 2rem;

        @media screen and (max-width: 1068px) {
            text-align: center;
        }
    }

    min-width: 400px;
    max-width: 30vw;
`;

const Title = styled.h1`
    color: ${lighten(-0.1, darktheme.fontdark)};
`;

const SubTitle = styled.h3`
    color: ${lighten(-0.1, darktheme.fontdark)};
`;

const TabletContainer = styled.div`
    background-color: #fafafa;
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    border: 1px solid #ddd;
    padding: 3rem;
    border-radius: 20px;

    max-width: 40vw;
    box-sizing: border-box;

    margin-left: auto;

    img {
        width: 100%;
        border: 1px solid #f0f0f0;
    }

    @media screen and (max-width: 1068px) {
        max-width: 100%;
        margin-left: auto;
        margin-right: auto;

        order: -1;

        margin-bottom: 32px;
    }
`;

const TextInput = styled.input`
    font-size: 18px;
    padding: 8px 16px;
    background-color: transparent;
    border: none;
    border-bottom: 2px solid #333;
    width: 100%;
    color: ${darkmodeEnabled && darktheme.fontdark};
`;

function HomePage() {
    const history = useHistory();

    const [roomName, setRoomName] = useState();

    const handleCreateNewRoom = () => {
        history.push(`/${uuidv4()}`);
    };

    const handleEnterRoom = () => {
        history.push(`/${roomName}`);
    };

    return (
        <Flex
            width="85%"
            height="100%"
            alignSelf="center"
            alignItems={window.innerWidth < 1068 ? 'center' : 'flex-start'}
            direction="column"
            margin="80px 0 0 0"
        >
            <HeaderLogo />

            <Flex
                width="100%"
                height="100%"
                direction={window.innerWidth < 1068 ? 'column' : 'row'}
            >
                <Flex
                    flex="1"
                    width="50%"
                    direction="column"
                    alignItems="flex-start"
                >
                    <Container
                        direction="column"
                        alignItems={
                            window.innerWidth < 1068 ? 'center' : 'flex-start'
                        }
                        margin="0 0 32px 0"
                    >
                        <Title>
                            O que está esperando
                            <br />
                            para começar um papo? Não custa nada!
                        </Title>
                        <SubTitle>
                            Começe criando uma nova reunião e envie o link para
                            seus amigos, ou acesse usando um código/link.
                        </SubTitle>
                    </Container>
                    <Flex justifyContent="flex-start" width="100%">
                        <Button
                            padding="12px 0"
                            minWidth="200px"
                            margin="0 32px 0 0"
                            onClick={handleCreateNewRoom}
                        >
                            <FaVideo />
                            <span>Novo papo</span>
                        </Button>

                        <form onSubmit={handleEnterRoom}>
                            <TextInput
                                name="room_name"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="Nome da sala"
                            />
                        </form>
                    </Flex>
                </Flex>

                <TabletContainer>
                    <img src={peopleGrid} alt="Pessoas" />
                </TabletContainer>
            </Flex>
        </Flex>
    );
}

export default HomePage;
