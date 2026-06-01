import apiClient from "../api/apiClient";

const emergencyService = {
  async createEmergency(formData) {
    const response = await apiClient.post("/emergencies", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  async getMyEmergencies(params = {}) {
    const response = await apiClient.get("/emergencies/my", { params });
    return {
      data: response.data.data?.emergencies || [],
      pagination: response.data.pagination || null,
    };
  },

  async getDashboard(params = {}) {
    const response = await apiClient.get("/emergencies/dashboard", { params });
    return {
      data: response.data.data?.emergencies || [],
      pagination: response.data.pagination || null,
    };
  },

  async getById(id) {
    const response = await apiClient.get(`/emergencies/${id}`);
    return response.data.data;
  },

  async acknowledge(id, payload = {}) {
    const response = await apiClient.patch(`/emergencies/${id}/acknowledge`, payload);
    return response.data.data;
  },

  async updateStatus(id, payload) {
    const response = await apiClient.patch(`/emergencies/${id}/status`, payload);
    return response.data.data;
  },

  async assignResources(id, payload) {
    const response = await apiClient.patch(`/emergencies/${id}/resources`, payload);
    return response.data.data;
  },

  async assignVolunteers(id, payload) {
    const response = await apiClient.patch(`/emergencies/${id}/volunteers`, payload);
    return response.data.data;
  },

  async getAnalytics() {
    const response = await apiClient.get("/emergencies/analytics");
    return response.data.data;
  },
};

export default emergencyService;
