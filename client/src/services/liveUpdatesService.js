import { io } from "socket.io-client";

import { API_BASE_URL } from "../utils/constants";

let socket = null;

const buildSocketBaseUrl = () => API_BASE_URL.replace("/api/v1", "").replace("/api", "");

export const connectLiveUpdates = (context) => {
  if (!socket) {
    socket = io(buildSocketBaseUrl(), {
      transports: ["websocket", "polling"],
    });
  }

  socket.emit("subscribe", context);

  return socket;
};

export const disconnectLiveUpdates = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getLiveUpdatesSocket = () => socket;
