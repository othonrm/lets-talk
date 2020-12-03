import React from "react";

import Connection from "../../services/connection";
// import "../../services/old_connection";

console.log("BLA");

function RoomPage() {
    return (
        <div>
            <Connection />
            <div id="video-grid"></div>
        </div>
    );
}

export default RoomPage;
