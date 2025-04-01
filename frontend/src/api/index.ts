import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for 401 errors if not accessing a shared resource
    if (error.response && error.response.status === 401) {
      // Check if the request URL contains share_token parameter
      const url = error.config.url;
      if (url && !url.includes('share_token')) {
        // Clear local storage and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await axios.post(`${API_URL}/token`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
};

export const register = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await api.post('/users/', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// URLs API
export const createUrl = async (originalUrl: string) => {
  const response = await api.post('/urls/', { original_url: originalUrl });
  return response.data;
};

export const getUrls = async () => {
  const response = await api.get('/urls/');
  return response.data;
};

export const getUrlDetails = async (shortCode: string) => {
  const response = await api.get(`/urls/${shortCode}`);
  return response.data;
};

export const getUrlStats = async (shortCode: string, shareToken?: string) => {
  const url = `/urls/${shortCode}/stats${shareToken ? `?share_token=${shareToken}` : ''}`;
  const response = await api.get(url);
  return response.data;
};

export const deleteUrl = async (shortCode: string) => {
  const response = await api.delete(`/urls/${shortCode}`);
  return response.data;
};

export const createShareLink = async (shortCode: string) => {
  const response = await api.post(`/urls/${shortCode}/share`);
  return response.data;
};

// Site Settings API
export const getSiteSettings = async () => {
  const response = await api.get('/settings/');
  return response.data;
};

export const updateSiteSettings = async (settings: {
  registration_enabled?: boolean;
}) => {
  const response = await api.patch('/settings/', settings);
  return response.data;
};

export default api;
