import {
    BrowserRouter as Router,
    Link,
    Redirect,
    Route,
    Switch,
} from "react-router-dom";
import { Flex, GlobalStyle } from "./helpers/styles";
import { v4 as uuidv4 } from "uuid";

import RoomPage from "./pages/RoomPage";

import logo from "./assets/images/letstalk-logo.png";
import styled from "styled-components";

const Logo = styled.img.attrs(() => ({
    src: logo,
}))`
    height: 82px;
`;

const Container = styled(Flex)`
    h2 {
        color: #444;
        margin: 2rem 0px;
        max-width: 300px;
        text-align: center;
    }

    a {
        background: rgb(55, 38, 176);
        background: linear-gradient(
            180deg,
            rgba(55, 38, 176, 1) 0%,
            rgba(193, 105, 213, 1) 100%
        );
        box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
        cursor: pointer;

        text-decoration: none;
        padding: 0.5rem 2rem;
        border-radius: 8px;
        margin-top: 1.5rem;
        color: #fff;
        font-size: 17px;
    }
`;

function App() {
    return (
        <>
            <GlobalStyle />

            <Router>
                <Switch>
                    <Route exact path="/">
                        <h1>Redirecting to random room...</h1>
                        <Redirect to={`/${uuidv4()}`} />
                    </Route>

                    <Route exact path="/:room_id">
                        <RoomPage />
                    </Route>

                    <Route path="/*">
                        <Container
                            margin="auto"
                            alignSelf="center"
                            direction="column"
                        >
                            <Logo />
                            <h2>
                                Ops, não encontramos o que você está
                                procurando...
                            </h2>
                            <Link to="/">Voltar à tela inicial</Link>
                        </Container>
                    </Route>
                </Switch>
            </Router>
        </>
    );
}

export default App;
