const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "..", "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const writeLog = (filename, level, message, meta = null) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };

  const serialized = `${JSON.stringify(payload)}\n`;
  fs.appendFileSync(path.join(logsDir, filename), serialized);
};

const logger = {
  info(message, meta = null) {
    writeLog("app.log", "info", message, meta);
  },

  warn(message, meta = null) {
    writeLog("app.log", "warn", message, meta);
  },

  error(message, meta = null) {
    writeLog("error.log", "error", message, meta);
  },

  stream: {
    write(message) {
      logger.info(message.trim());
    },
  },
};

module.exports = logger;
