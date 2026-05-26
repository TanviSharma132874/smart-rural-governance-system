import apiClient from "../api/apiClient";

const complaintService = {
  async getComplaints(params = {}) {
    const response = await apiClient.get("/complaints", { params });

    return {
      data: response.data.data || [],
      pagination: response.data.pagination || null,
    };
  },

  async getComplaintById(complaintId) {
    const response = await apiClient.get(`/complaints/${complaintId}`);
    return response.data.data;
  },

  async createComplaint(formData) {
    const response = await apiClient.post("/complaints", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  async updateComplaintStatus(complaintId, payload) {
    const response = await apiClient.patch(`/complaints/${complaintId}/status`, payload);
    return response.data.data;
  },

  async assignComplaint(complaintId, payload) {
    const response = await apiClient.patch(`/complaints/${complaintId}/assign`, payload);
    return response.data.data;
  },
};

export default complaintService;
