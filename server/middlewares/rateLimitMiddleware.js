const rateLimit = require("express-rate-limit");

const createRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
      data: null,
    },
  });

const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests from this IP. Please try again shortly.",
});

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: "Too many authentication attempts. Please wait before trying again.",
});

module.exports = {
  apiRateLimiter,
  authRateLimiter,
};
