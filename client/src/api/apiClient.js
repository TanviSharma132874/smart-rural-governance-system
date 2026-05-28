import axios from "axios";

import { getStoredToken } from "../utils/storage";
import { API_BASE_URL } from "../utils/constants";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("app:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
