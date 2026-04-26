import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the backend returns a 401 or 403, and the user is authenticated. We could force logout
    if (error.response && [401, 403].includes(error.response.status)) {
      if (useAuthStore.getState().isAuthenticated) {
        // useAuthStore.getState().logout();
        // Optional redirect to login. Note: commented to avoid breaking your current page logic
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
