import {
    BrowserRouter as Router,
    Redirect,
    Route,
    Switch,
} from "react-router-dom";
import { GlobalStyle } from "./helpers/styles";
import { v4 as uuidv4 } from "uuid";

import RoomPage from "./pages/RoomPage";

function App() {
    return (
        <div className="App">
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
                </Switch>
            </Router>
        </div>
    );
}

export default App;
