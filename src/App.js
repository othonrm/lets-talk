import { Route, Switch, useHistory } from "react-router-dom";

import { GlobalStyle } from "./helpers/styles";

import RoomPage from "./pages/RoomPage";

import { useEffect } from "react";
import RoomLeavePage from "./pages/RoomLeavePage";
import NotFoundPage from "./pages/NotFoundPage";
import HomePage from "./pages/HomePage";

function App() {
    const history = useHistory();

    useEffect(() => {
        history.listen(() => {
            window.scrollTo({ top: 0 });
        });

        window.scrollTo({ top: 0 });

        // eslint-disable-next-line
    }, []);

    return (
        <>
            <GlobalStyle />

            <Switch>
                <Route exact path="/">
                    <HomePage />
                </Route>

                <Route exact path="/:room_id">
                    <RoomPage />
                </Route>

                <Route exact path="/:room_id/out">
                    <RoomLeavePage />
                </Route>

                <Route path="/*">
                    <NotFoundPage />
                </Route>
            </Switch>
        </>
    );
}

export default App;
