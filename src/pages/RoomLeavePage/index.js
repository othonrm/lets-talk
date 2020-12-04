import React from "react";
import { Link, useHistory, useParams } from "react-router-dom";

import { Flex } from "../../helpers/styles";

import Button from "../../components/Button";
import Logo from "../../components/Logo";

function RoomLeavePage() {
    const { room_id } = useParams();
    const history = useHistory();

    return (
        <Flex margin="auto" alignSelf="center" direction="column">
            <Logo />

            <Flex margin="32px 0">
                <h2>Você encerrou o papo</h2>
            </Flex>

            <Flex>
                <Button
                    outlined
                    margin="0 16px 0 0"
                    onClick={() => history.push(`/${room_id}`)}
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
