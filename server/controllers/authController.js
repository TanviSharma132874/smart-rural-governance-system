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

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);

  sendSuccess(res, {
    statusCode: 200,
    message: "Profile updated successfully",
    data: { user },
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { users, pagination } = await authService.getUsers(req.user, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Users fetched successfully",
    data: { users, pagination },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  await authService.deleteUser(req.params.id, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "User account archived successfully",
  });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const user = await authService.resetUserPassword(req.params.id, req.body.password, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "User password reset successfully",
    data: { user },
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await authService.updateUserStatus(req.params.id, req.body.status, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "User status updated successfully",
    data: { user },
  });
});

const transferUser = asyncHandler(async (req, res) => {
  const user = await authService.transferUser(req.params.id, req.body, req.user);

  sendSuccess(res, {
    statusCode: 200,
    message: "User department/jurisdiction transferred successfully",
    data: { user },
  });
});

module.exports = {
  register,
  createUser,
  getUsers,
  deleteUser,
  login,
  getProfile,
  updateProfile,
  resetUserPassword,
  updateUserStatus,
  transferUser,
};
