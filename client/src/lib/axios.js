import axios from "axios";
import { useAuthStore } from "../store/authStore";
import API_ENDPOINTS from "./apiEndpoints";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh logic for public endpoints - let them handle their own errors
    const requestUrl = originalRequest.url || originalRequest.baseURL + originalRequest.url || '';
    const isPublicEndpoint = requestUrl.includes('/auth/login') || 
                             requestUrl.includes('/auth/register') ||
                             requestUrl.includes('/auth/request-reset') ||
                             requestUrl.includes('/auth/reset-password') ||
                             requestUrl.includes('/leases-invite/invite/') ||
                             requestUrl.includes('/leases-invite/sign/');

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const token = localStorage.getItem("token");

      if (!token) {
        isRefreshing = false;
        // Don't automatically logout - let user stay logged in until manual logout
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const newToken = response.data.data.token;
        useAuthStore.getState().setToken(newToken);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Don't automatically logout - let user stay logged in until manual logout
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
