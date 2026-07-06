import axios from 'axios';
import { getToken, updateTokenInPlace, clearToken } from '../utils/tokenStorage';

const apiClient = axios.create({
  baseURL: 'https://axt-qmh7.onrender.com/api/v1', // Make sure this matches your API route structure!
  withCredentials: true,
});

// Dynamic Request Interceptor: Automatically append active JWT variables
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Dynamic Response Interceptor: Central failure capture node
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check for expired token indicators and ensure we aren't stuck in infinite retry loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Call the refresh endpoint to obtain updated access signatures securely
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = response.data;
        updateTokenInPlace(accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Dynamic Token rotation failed: Flush local memory state and log out user
        clearToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
