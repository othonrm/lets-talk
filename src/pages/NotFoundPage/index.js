import React from "react";
import { Link } from "react-router-dom";

import { Flex } from "../../helpers/styles";

import Logo from "../../components/Logo";
import Button from "../../components/Button";

function NotFoundPage() {
    return (
        <Flex margin="auto" alignSelf="center" direction="column">
            <Logo />

            <Flex margin="32px 0">
                <h2>Ops, não encontramos o que você está procurando...</h2>
            </Flex>

            <Button as={Link} to="/">
                Voltar à tela inicial
            </Button>
        </Flex>
    );
}

export default NotFoundPage;
