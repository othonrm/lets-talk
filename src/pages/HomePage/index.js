import React from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";

import { FaVideo } from "react-icons/fa";

import { Flex } from "../../helpers/styles";

import Button from "../../components/Button";

import logo from "../../assets/images/letstalk-logo.png";
import people_grid from "../../assets/images/people_grid.png";

const HeaderLogo = styled.img.attrs(() => ({
    src: logo,
    height: "62px",
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
    }
`;

function HomePage() {
    const history = useHistory();

    const handleCreateNewRoom = () => {
        history.push(`/${uuidv4()}`);
    };

    return (
        <Flex
            width="85%"
            alignSelf="center"
            alignItems={window.innerWidth < 1068 ? "center" : "flex-start"}
            direction="column"
            margin="80px 0 0 0"
        >
            <HeaderLogo />

            <Flex
                width="100%"
                direction={window.innerWidth < 1068 ? "column" : "row"}
            >
                <Container
                    direction="column"
                    alignItems={
                        window.innerWidth < 1068 ? "center" : "flex-start"
                    }
                    margin="0 0 32px 0"
                >
                    <h1>
                        O que está esperando <br />
                        para começar um papo? Não custa nada!
                    </h1>
                    <h3>
                        Começe criando uma nova reunião e envie o link para seus
                        amigos, ou acesse usando um código/link.
                    </h3>
                    <Button
                        padding="12px 0"
                        minWidth="200px"
                        margin="0"
                        onClick={handleCreateNewRoom}
                    >
                        <FaVideo />
                        <span>Novo papo</span>
                    </Button>
                </Container>

                <TabletContainer>
                    <img src={people_grid} alt="Pessoas" />
                </TabletContainer>
            </Flex>
        </Flex>
    );
}

export default HomePage;
