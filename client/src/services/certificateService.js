import apiClient from "../api/apiClient";

const certificateService = {
  async apply(formData) {
    const response = await apiClient.post("/certificates/apply", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  async getMyApplications() {
    const response = await apiClient.get("/certificates/my-applications");
    return response.data.data;
  },

  async getDepartmentQueue(params = {}) {
    const response = await apiClient.get("/certificates/department-queue", { params });
    return response.data.data;
  },

  async getById(id) {
    const response = await apiClient.get(`/certificates/${id}`);
    return response.data.data;
  },

  async review(id, payload) {
    const response = await apiClient.patch(`/certificates/${id}/review`, payload);
    return response.data.data;
  },

  async updateStatus(id, payload) {
    const response = await apiClient.patch(`/certificates/${id}/status`, payload);
    return response.data.data;
  },

  async verify(id) {
    const response = await apiClient.get(`/certificates/verify/${id}`);
    return response.data.data;
  },

  async download(id) {
    const response = await apiClient.get(`/certificates/download/${id}`, {
      responseType: "blob",
    });
    return response.data;
  },

  async archive(id) {
    const response = await apiClient.delete(`/certificates/${id}`);
    return response.data.data;
  },
};

export default certificateService;
