import apiClient from "../api/apiClient";

const resourceService = {
  async create(payload) {
    const response = await apiClient.post("/resources", payload);
    return response.data.data;
  },

  async list(params = {}) {
    const response = await apiClient.get("/resources", { params });
    return {
      data: response.data.data?.resources || [],
      pagination: response.data.pagination || null,
    };
  },

  async update(id, payload) {
    const response = await apiClient.patch(`/resources/${id}`, payload);
    return response.data.data;
  },

  async returnResource(id, allocationId, returnRemarks = "") {
    const response = await apiClient.patch(`/resources/${id}/return`, { allocationId, returnRemarks });
    return response.data.data;
  },

  async addMaintenance(id, payload) {
    const response = await apiClient.post(`/resources/${id}/maintenance`, payload);
    return response.data.data;
  },
};

export default resourceService;
