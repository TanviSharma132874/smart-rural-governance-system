const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");
const sendSuccess = require("../utils/apiResponse");

const register = asyncHandler(async (req, res) => {
  const payload = await authService.registerUser(req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully",
    data: payload,
  });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await authService.createPrivilegedUser(req.body, req.user);

  sendSuccess(res, {
    statusCode: 201,
    message: "Privileged user provisioned successfully",
    data: { user },
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = await authService.loginUser(req.body);

  sendSuccess(res, {
    statusCode: 200,
    message: "Login successful",
    data: payload,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);

  sendSuccess(res, {
    statusCode: 200,
    message: "Profile fetched successfully",
    data: { user },
  });
});

module.exports = {
  register,
  createUser,
  login,
  getProfile,
};
