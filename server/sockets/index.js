const jwt = require("jsonwebtoken");
const User = require("../models/User");

let socketServer = null;

/**
 * Derives standard room names strictly from authenticated user context.
 * This prevents room spoofing and unauthorized data access.
 */
const buildRooms = (user = {}) => {
  const rooms = [];

  if (user.id) {
    rooms.push(`user:${user.id}`);
  }

  if (user.role) {
    rooms.push(`role:${user.role}`);
  }

  if (user.department) {
    rooms.push(`department:${user.department}`);
  }

  if (user.state) {
    rooms.push(`state:${user.state}`);
  }

  if (user.district) {
    rooms.push(`district:${user.district}`);
  }

  if (user.jurisdictionType) {
    rooms.push(`jurisdiction:${user.jurisdictionType}`);
  }

  if (user.village) {
    rooms.push(`village:${user.village}`);
  }

  if (user.municipality) {
    rooms.push(`municipality:${user.municipality}`);
  }

  return rooms;
};

/**
 * Emits events to specific rooms or globally.
 * Rooms are server-controlled to maintain security boundaries.
 */
const emitRealtimeEvent = (rooms = [], event, payload) => {
  if (!socketServer || !event) {
    return;
  }

  const roomList = Array.isArray(rooms) ? rooms.filter(Boolean) : [rooms].filter(Boolean);

  if (roomList.length === 0) {
    socketServer.emit(event, payload);
    return;
  }

  roomList.forEach((room) => {
    socketServer.to(room).emit(event, payload);
  });
};

/**
 * Initializes Socket.IO with JWT Handshake Authentication.
 * This is the critical security gate for all realtime features.
 */
const initializeSockets = (io) => {
  socketServer = io;

  // 1. Mandatory JWT Handshake Authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: Token missing from handshake"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password").lean();

      if (!user) {
        return next(new Error("Authentication error: User identity not found in database"));
      }

      // 2. Attach immutable authenticated identity to the socket object
      socket.user = {
        id: user._id.toString(),
        role: user.role,
        department: user.department,
        state: user.state,
        district: user.district,
        jurisdictionType: user.jurisdictionType,
        village: user.village,
        municipality: user.municipality,
      };

      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid or expired token session"));
    }
  });

  io.on("connection", (socket) => {
    // 3. Automatic Server-Side Room Assignment
    // Clients NEVER choose which rooms they join.
    const rooms = buildRooms(socket.user);
    rooms.forEach((room) => socket.join(room));

    // 4. Secure Subscription Re-sync
    // Even on manual request, rooms are rebuilt ONLY from authenticated socket.user data.
    socket.on("subscribe", () => {
      const currentRooms = buildRooms(socket.user);
      currentRooms.forEach((room) => socket.join(room));
    });

    socket.on("disconnect", () => {
      // Disconnection cleanup is handled automatically by Socket.IO
    });
  });
};

module.exports = {
  initializeSockets,
  emitRealtimeEvent,
};
