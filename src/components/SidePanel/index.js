import React, { useEffect, useState } from "react";
import styled, { css } from "styled-components";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
    FaMicrophoneAlt,
    FaMicrophoneAltSlash,
    FaVideo,
    FaVideoSlash,
} from "react-icons/fa";

import { darkmodeEnabled, darktheme, Flex } from "../../helpers/styles";
import Button from "../Button";
import { lighten } from "polished";

const Container = styled.div`
    width: 350px;
    height: 100%;
    box-sizing: border-box;
    background-color: ${darktheme.secondary};
    overflow-x: hidden;
    transition: all 0.2s ease-in-out;
    margin-right: -350px;
    display: flex;
    flex-direction: column;
    z-index: 2;
    box-shadow: -3px -1px 6px rgba(0, 0, 0, 0.16);

    ${(props) =>
        props.active &&
        css`
            margin-right: 0px;
        `}

    @media screen and (max-width: 760px) {
        position: absolute;
        top: 0px;
        bottom: 0px;
        right: 0px;

        max-width: 100vw;
    }
`;

const UserContainer = styled.div`
    background-color: ${darktheme.primary};
    color: ${darktheme.fontdark};
    box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.16);
    width: 100%;
    padding: 10px 16px;
    margin-bottom: 12px;
    border-radius: 6px;
    box-sizing: border-box;

    display: flex;
    justify-content: flex-start;
    align-items: center;

    text-transform: capitalize;
`;

const TabTitle = styled.h4`
    color: ${darktheme.fontdark};
`;

const Avatar = styled.div`
    background: #e6e690;
    color: #444;
    padding: 6px;
    border-radius: 6px;
    margin-right: 10px;
    width: 32px;
    height: 32px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const MessageContainer = styled.div`
    background-color: rgba(200, 200, 200, 0.6);
    width: auto;
    padding: 10px 16px;
    margin-bottom: 12px;
    border-radius: 0px 10px 10px 10px;
    box-sizing: border-box;

    ${(props) =>
        props.me &&
        css`
            border-radius: 10px 0px 10px 10px;
            background: rgb(55, 38, 176);
            background: linear-gradient(
                180deg,
                rgba(55, 38, 176, 1) 0%,
                rgba(193, 105, 213, 1) 100%
            );
            margin-left: auto;
            color: #fff;
        `}
`;

const InputContainer = styled(Flex)`
    border-top: 2px solid
        ${lighten(darkmodeEnabled ? -0.1 : -0.15, darktheme.primary)};
    background-color: ${lighten(
        darkmodeEnabled ? -0.05 : -0.1,
        darktheme.primary
    )};
    height: auto;
    padding: 8px 16px;
    width: 100%;
    box-sizing: border-box;
`;

const MessageInput = styled.input`
    flex: 1;
    width: auto;
    height: auto;
    font-size: 15px;
    border: none;
    border-radius: 0px;
    padding: 0px;
    background-color: transparent;
    color: ${darktheme.fontdark};
`;

function SidePanel() {
    const [socket, setSocket] = useState(window.socket);
    const [roomMembers, setRoomMembers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [active, setActive] = useState(false);
    const [tab, setTab] = useState("members");
    const [inputMessage, setInputMessage] = useState("");

    useEffect(() => {
        const checkSocket = () => {
            if (window.socket === undefined) {
                setTimeout(checkSocket, 0);
            } else {
                window.socket.on("room-members", (_roomMembers) => {
                    console.log("Room members: ", _roomMembers);
                    setRoomMembers(_roomMembers);
                });

                window.socket.on("received-message", (msg) => {
                    setMessages([...messages, msg]);

                    typeof window.onReceivedMessage === "function" &&
                        window.onReceivedMessage();
                });

                setSocket(window.socket);
            }
        };

        if (socket === undefined) checkSocket();

        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        window.socket &&
            window.socket.on("received-message", (msg) => {
                setMessages([...messages, msg]);

                typeof window.onReceivedMessage === "function" &&
                    window.onReceivedMessage();
            });

        return () => {
            window.socket &&
                window.socket.removeAllListeners("received-message");
        };

        // eslint-disable-next-line
    }, [socket, messages]);

    const toggleSidePanel = () => {
        window.sidePanelActive =
            window.sidePanelActive === undefined
                ? active
                : window.sidePanelActive;

        window.sidePanelActive = !window.sidePanelActive;

        setActive(window.sidePanelActive);

        typeof window.onToggleSidePanel === "function" &&
            window.onToggleSidePanel();
    };

    window.toggleSidePanel = toggleSidePanel;

    const showMembersTab = () => {
        setTab("members");
    };

    const showChatTab = () => {
        setTab("chat");
    };

    const handleSendMessage = (e) => {
        e && e.preventDefault && e.preventDefault();

        let message = inputMessage;

        message = message.trim();

        if (message.length === 0) return;

        setInputMessage("");

        console.log("sending message: " + message);

        socket.emit("message", message);
    };

    return !socket ? null : (
        <>
            <Container active={active}>
                <Flex width="100%" margin="12px 0 0 0">
                    <Button
                        outlined={tab !== "members"}
                        color={tab !== "members" && darktheme.fontdark}
                        padding="8px 0px"
                        width="100px"
                        margin="0 30px 0 0"
                        onClick={showMembersTab}
                    >
                        Membros
                    </Button>
                    <Button
                        outlined={tab !== "chat"}
                        color={tab !== "chat" && darktheme.fontdark}
                        padding="8px 0px"
                        width="100px"
                        margin="0"
                        onClick={showChatTab}
                    >
                        Conversa
                    </Button>
                </Flex>
                {tab === "members" && (
                    <Flex
                        alignItems="flex-start"
                        direction="row"
                        height="100%"
                        maxHeight="calc(100% - 50px)"
                        width="100%"
                        flex="1"
                        padding="26px"
                        boxSizing="border-box"
                    >
                        <TabTitle>NA SALA ({roomMembers.length})</TabTitle>

                        <Flex
                            alignItems="flex-start"
                            justifyContent="flex-start"
                            margin="16px 0 0 0"
                            width="100%"
                            height="calc(100% - 16px)"
                            maxHeight="calc(100% - 16px)"
                            overflow="hidden auto"
                            direction="column"
                            wrap="no-wrap"
                            boxSizing="border-box"
                            padding="16px 0"
                        >
                            {roomMembers &&
                                roomMembers.map((user) => (
                                    <UserContainer key={user.id}>
                                        <Avatar>{getInitals(user.name)}</Avatar>
                                        {user.name}{" "}
                                        {user.socket === socket.id && "(Você)"}
                                        <Flex
                                            color={
                                                user.audio ? "green" : "gray"
                                            }
                                            margin="0 6px 0 auto"
                                        >
                                            {user.audio ? (
                                                <FaMicrophoneAlt />
                                            ) : (
                                                <FaMicrophoneAltSlash />
                                            )}
                                        </Flex>
                                        <Flex
                                            color={
                                                user.video ? "green" : "gray"
                                            }
                                        >
                                            {user.video ? (
                                                <FaVideo />
                                            ) : (
                                                <FaVideoSlash />
                                            )}
                                        </Flex>
                                    </UserContainer>
                                ))}
                        </Flex>
                    </Flex>
                )}

                {tab === "chat" && (
                    <Flex
                        justifyContent="flex-start"
                        direction="column"
                        height="100%"
                        maxHeight="calc(100% - 50px)"
                        width="100%"
                        flex="1"
                        padding="0"
                        boxSizing="border-box"
                    >
                        <Flex
                            alignItems="flex-start"
                            justifyContent="flex-end"
                            margin="0 0 10px 0"
                            width="100%"
                            height="auto"
                            overflow="hidden auto"
                            direction="column"
                            wrap="no-wrap"
                            boxSizing="border-box"
                            padding="16px 8px 0 8px"
                            flex="1"
                        >
                            {messages &&
                                messages.map((message, index) => (
                                    <Flex
                                        width="100%"
                                        direction="column"
                                        alignItems={
                                            message.sender === socket.id
                                                ? "flex-end"
                                                : "flex-start"
                                        }
                                        key={index}
                                    >
                                        {(!messages[index - 1] ||
                                            format(
                                                new Date(
                                                    messages[index - 1].date
                                                ),
                                                "HH:mm",
                                                {
                                                    locale: ptBR,
                                                }
                                            ) !==
                                                format(
                                                    new Date(message.date),
                                                    "HH:mm",
                                                    {
                                                        locale: ptBR,
                                                    }
                                                ) ||
                                            messages[index - 1].sender !==
                                                message.sender) && (
                                            <Flex
                                                width="100%"
                                                justifyContent="center"
                                                as="small"
                                                margin="0 0 0px 0"
                                            >
                                                {format(
                                                    new Date(message.date),
                                                    "HH:mm",
                                                    {
                                                        locale: ptBR,
                                                    }
                                                )}
                                            </Flex>
                                        )}

                                        {(!messages[index - 1] ||
                                            messages[index - 1].sender !==
                                                message.sender) && (
                                            <Flex
                                                width="100%"
                                                justifyContent={
                                                    message.sender === socket.id
                                                        ? "flex-end"
                                                        : "flex-start"
                                                }
                                                as="small"
                                                margin="0 0 6px 0"
                                            >
                                                <p>
                                                    {roomMembers.find(
                                                        (item) =>
                                                            item.socket ===
                                                            message.sender
                                                    )
                                                        ? roomMembers.find(
                                                              (item) =>
                                                                  item.socket ===
                                                                  message.sender
                                                          ).name
                                                        : "Convidado"}
                                                </p>
                                            </Flex>
                                        )}
                                        <MessageContainer
                                            me={message.sender === socket.id}
                                            title="20:43"
                                        >
                                            {message.content}
                                        </MessageContainer>
                                    </Flex>
                                ))}
                        </Flex>

                        <InputContainer
                            width="100%"
                            margin="auto 0 0 0 "
                            as="form"
                            onSubmit={handleSendMessage}
                        >
                            <MessageInput
                                placeholder="Mande uma mensagem..."
                                name="message"
                                type="text"
                                value={inputMessage}
                                onChange={(e) =>
                                    setInputMessage(e.target.value)
                                }
                            />
                            <Button
                                margin="0 0 0 10px"
                                padding="4px 12px"
                                link
                                onClick={handleSendMessage}
                                color={darkmodeEnabled && darktheme.fontdark}
                            >
                                Enviar
                            </Button>
                        </InputContainer>
                    </Flex>
                )}
            </Container>
        </>
    );
}

export default SidePanel;

const getInitals = (name) => {
    let firstInitial = "G";
    let secondInitial = "";

    name = name.trim().split(" ");

    if (name.length > 0) {
        firstInitial = name[0][0];

        if (name.length > 1) {
            secondInitial = name[1][0];
        }
    }

    return firstInitial + secondInitial;
};
