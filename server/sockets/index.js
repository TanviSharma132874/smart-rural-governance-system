let socketServer = null;

const buildRooms = (context = {}) => {
  const rooms = [];

  if (context.userId) {
    rooms.push(`user:${context.userId}`);
  }

  if (context.role) {
    rooms.push(`role:${context.role}`);
  }

  if (context.department) {
    rooms.push(`department:${context.department}`);
  }

  if (context.state) {
    rooms.push(`state:${context.state}`);
  }

  if (context.district) {
    rooms.push(`district:${context.district}`);
  }

  if (context.jurisdictionType) {
    rooms.push(`jurisdiction:${context.jurisdictionType}`);
  }

  if (context.village) {
    rooms.push(`village:${context.village}`);
  }

  if (context.municipality) {
    rooms.push(`municipality:${context.municipality}`);
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

  io.on("connection", (socket) => {
    socket.on("subscribe", (context = {}) => {
      buildRooms(context).forEach((room) => socket.join(room));
    });

    socket.on("disconnect", () => {
      // Intentionally quiet; request/error logs already capture server activity.
    });
  });
};

module.exports = {
  initializeSockets,
  emitRealtimeEvent,
};
