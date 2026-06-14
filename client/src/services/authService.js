import apiClient from "../api/apiClient";

const authService = {
  async register(payload) {
    const response = await apiClient.post("/auth/register", payload);
    return response.data.data;
  },

  async login(payload) {
    const response = await apiClient.post("/auth/login", payload);
    return response.data.data;
  },

  async getProfile() {
    const response = await apiClient.get("/auth/profile");
    return response.data.data;
  },

  async listUsers(params = {}) {
    const response = await apiClient.get("/auth", { params });
    return response.data.data;
  },

  async provisionUser(payload) {
    const response = await apiClient.post("/auth/users", payload);
    return response.data.data;
  },

  async archiveUser(id) {
    const response = await apiClient.delete(`/auth/${id}`);
    return response.data.data;
  },

  async resetPassword(id, password) {
    const response = await apiClient.patch(`/auth/users/${id}/reset-password`, { password });
    return response.data.data;
  },

  async updateStatus(id, status) {
    const response = await apiClient.patch(`/auth/users/${id}/status`, { status });
    return response.data.data;
  },

  async transferUser(id, payload) {
    const response = await apiClient.patch(`/auth/users/${id}/transfer`, payload);
    return response.data.data;
  },

  async updateProfile(payload) {
    const response = await apiClient.patch("/auth/profile", payload);
    return response.data.data;
  },
};

export default authService;
