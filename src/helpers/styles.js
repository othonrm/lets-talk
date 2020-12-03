import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`    
    *,
    body {
        padding: 0px;
        margin: 0px;
        background-color: rgb(245, 245, 245);
    }

    html,
    body {
        height: -webkit-fill-available;
    }

    body {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    h1 {
        margin-bottom: auto;
    }

    #video-grid {
        display: flex;
        justify-content: center;
        margin-bottom: auto;
    }

    video {
        width: 400px;
        height: 300px;
        object-fit: cover;
        border: 1px solid black;
    }

    video:not(:last-child) {
        margin-right: 1rem;
    }
`;
