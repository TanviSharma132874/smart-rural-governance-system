import apiClient from "../api/apiClient";

const volunteerService = {
  async register(payload) {
    const response = await apiClient.post("/volunteers/register", payload);
    return response.data.data;
  },

  async getProfile() {
    const response = await apiClient.get("/volunteers/me");
    return response.data.data;
  },

  async list(params = {}) {
    const response = await apiClient.get("/volunteers", { params });
    return {
      data: response.data.data?.volunteers || [],
      pagination: response.data.pagination || null,
    };
  },

  async approve(id, payload) {
    const response = await apiClient.patch(`/volunteers/${id}/approve`, payload);
    return response.data.data;
  },

  async updateAvailability(id, payload) {
    const response = await apiClient.patch(`/volunteers/${id}/availability`, payload);
    return response.data.data;
  },
};

export default volunteerService;
