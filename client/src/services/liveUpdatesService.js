import { io } from "socket.io-client";

import { API_BASE_URL } from "../utils/constants";
import { getStoredToken } from "../utils/storage";

// Socket service managing real-time connections.
// The lifecycle of the socket is owned and managed by DashboardLayout.
// Pages should register/unregister listeners but must not disconnect the socket directly.
let socket = null;
let currentToken = null;

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
    currentToken = token;
  } else if (currentToken !== token) {
    socket.auth.token = token;
    socket.disconnect().connect();
    currentToken = token;
  }

  // No need to pass context, server derives it from authenticated token
  socket.emit("subscribe");

  return socket;
};

export const disconnectLiveUpdates = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};

export const getLiveUpdatesSocket = () => socket;
