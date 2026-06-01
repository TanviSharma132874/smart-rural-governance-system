const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const { initializeSockets } = require("./sockets");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "*",
        credentials: true,
      },
    });

    initializeSockets(io);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
