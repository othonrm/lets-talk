import { useState } from "react";

export const addVideoStream = (video, stream, userId, userName) => {
    window.streams = [...(window.streams || []), stream];

    if (document.getElementById(userId)) return;

    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    let video_container = document.createElement("div");
    let id_text = document.createElement("p");
    let user_text = document.createElement("p");

    id_text.innerHTML = userId;
    id_text.className = "user_id";

    user_text.innerHTML = userName;
    user_text.className = "user_name";

    video_container.className = "video_container";

    video_container.id = userId;
    video_container.append(video);
    video_container.append(id_text);
    video_container.append(user_text);

    video_container.ondblclick = (e) => setFocus(e.target.id);

    let minimized_list = document.getElementById("minimized_list");
    let video_grid = document.getElementById("video_grid");

    if (minimized_list.classList.contains("show")) {
        minimized_list.append(video_container);
    } else {
        video_grid.append(video_container);
    }

    return video_container;
};

export const useForceUpdate = () => {
    // eslint-disable-next-line
    const [value, setValue] = useState(0);

    return () => setValue((value) => ++value);
};

export const replaceSenderTrack = (peerConnections, stream, elementRef) => {
    let videoTrack = stream.getVideoTracks()[0];

    peerConnections.forEach((item, index) => {
        if (!item) return;

        let sender = item.getSenders().find(function (s) {
            return s.track.kind === videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
    });

    if (elementRef.current) elementRef.current.srcObject = stream;
};

export const setFocus = (focus_id) => {
    console.log("focusing on: " + focus_id);

    let focus_element = document.getElementById(focus_id);
    let minimized_list = document.getElementById("minimized_list");
    let video_grid = document.getElementById("video_grid");

    if (
        focus_element.parentNode.id !== "video_grid" ||
        !minimized_list.classList.contains("show")
    ) {
        document.querySelectorAll(".video_container").forEach((el) => {
            if (el.id !== focus_id) {
                minimized_list.append(el);
            } else {
                video_grid.append(el);
            }
        });
    } else {
        document.querySelectorAll(".video_container").forEach((el) => {
            video_grid.append(el);
        });
    }

    if (minimized_list.childNodes.length > 0) {
        minimized_list.classList.add("show");
        video_grid.classList.add("minimized");
    } else {
        minimized_list.classList.remove("show");
        video_grid.classList.remove("minimized");
    }
};

window.setFocus = setFocus;
