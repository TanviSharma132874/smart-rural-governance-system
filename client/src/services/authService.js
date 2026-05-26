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
};

export default authService;
