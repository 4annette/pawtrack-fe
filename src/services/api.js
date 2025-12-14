import axios from 'axios';

const BASE_URL = import.meta.env.VITE_SPRING_BOOT_API_URL;

// Global instance for JSON requests
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add Token to every JSON request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// --- AUTH ---
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// --- FOUND REPORTS ---
export const fetchFoundReports = async (page = 0, size = 10, filters = {}) => {
  const params = new URLSearchParams({
    page: page,
    size: size,
    sortBy: 'dateFound', 
    sortDirection: 'DESC'
  });
  const response = await api.post(`/found-reports/filter?${params.toString()}`, filters || {});
  return response.data;
};

export const fetchMyLostReports = async () => {
  const response = await api.get(`/lost-reports?page=0&size=100&all=false`);
  return response.data;
};

export const fetchMyFoundReports = async () => {
  const response = await api.get(`/found-reports?page=0&size=100&all=false`);
  return response.data;
};

// --- CREATION & LINKING ---

export const createFoundReport = async (reportData) => {
  const payload = {
    title: reportData.title,
    description: reportData.description,
    dateFound: reportData.dateFound, 
    chipNumber: parseInt(reportData.chipNumber) || 0,
    species: reportData.species,
    condition: reportData.condition
  };

  const response = await api.post('/found-reports', payload);
  return response.data;
};

// --- FIX: USE FETCH FOR UPLOAD ---
// Using native fetch avoids Axios global header conflicts (application/json vs multipart)
export const uploadFoundReportImage = async (reportId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/found-reports/${reportId}/add-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // IMPORTANT: Do NOT set Content-Type here. 
      // The browser automatically sets "multipart/form-data; boundary=..."
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image upload failed: ${response.status} ${errorText}`);
  }

  // Handle response type (text or json)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
};

export const linkFoundToLostReport = async (foundReportId, lostReportId) => {
  const response = await api.patch(
    `/found-reports/${foundReportId}/add-lost-report/${lostReportId}`
  );
  return response.data;
};

export const connectFoundReports = async (foundReportId, connectedFoundReportId) => {
  const response = await api.patch(
    `/found-reports/${foundReportId}/add-found-report/${connectedFoundReportId}`
  );
  return response.data;
};

export default api;