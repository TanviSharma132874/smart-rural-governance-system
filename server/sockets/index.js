const jwt = require("jsonwebtoken");
const User = require("../models/User");

let socketServer = null;

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

const initializeSockets = (io) => {
  socketServer = io;

  // Authentication Middleware for Handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password").lean();

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach authenticated user data to socket
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
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Automatically join rooms based on authenticated user data
    const rooms = buildRooms(socket.user);
    rooms.forEach((room) => socket.join(room));

    // Handle explicit re-subscription if needed (still uses authenticated data)
    socket.on("subscribe", () => {
      const currentRooms = buildRooms(socket.user);
      currentRooms.forEach((room) => socket.join(room));
    });

    socket.on("disconnect", () => {
      // Intentionally quiet
    });
  });
};

module.exports = {
  initializeSockets,
  emitRealtimeEvent,
};
