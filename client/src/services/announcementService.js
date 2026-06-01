import apiClient from "../api/apiClient";

const announcementService = {
  async create(payload) {
    const response = await apiClient.post("/announcements", payload);
    return response.data.data;
  },

  async list(params = {}) {
    const response = await apiClient.get("/announcements", { params });
    return {
      data: response.data.data?.announcements || [],
      pagination: response.data.pagination || null,
    };
  },

  async getById(id) {
    const response = await apiClient.get(`/announcements/${id}`);
    return response.data.data;
  },

  async publish(id, payload) {
    const response = await apiClient.patch(`/announcements/${id}/publish`, payload);
    return response.data.data;
  },
};

export default announcementService;
