import { io } from "socket.io-client";

import { API_BASE_URL } from "../utils/constants";
import { getStoredToken } from "../utils/storage";

let socket = null;

const buildSocketBaseUrl = () => API_BASE_URL.replace("/api/v1", "").replace("/api", "");

export const connectLiveUpdates = () => {
  const token = getStoredToken();
  
  if (!socket) {
    socket = io(buildSocketBaseUrl(), {
      transports: ["websocket", "polling"],
      auth: {
        token,
      },
    });
  }

  // No need to pass context, server derives it from authenticated token
  socket.emit("subscribe");

  return socket;
};

export const disconnectLiveUpdates = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getLiveUpdatesSocket = () => socket;
