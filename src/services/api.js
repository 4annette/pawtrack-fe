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

// ==========================================
//               FOUND REPORTS
// ==========================================

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

// EXPLICIT ENDPOINT: Upload Image for Found Report
export const uploadFoundReportImage = async (reportId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("token");

  // Hits /found-reports/{id}/add-image
  const response = await fetch(`${BASE_URL}/found-reports/${reportId}/add-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Found report image upload failed: ${response.status} ${errorText}`);
  }
  
  const contentType = response.headers.get("content-type");
  return (contentType && contentType.includes("application/json")) 
    ? await response.json() 
    : await response.text();
};

// ==========================================
//               LOST REPORTS
// ==========================================

// Matches image_abc603.png (POST /lost-reports/filter)
export const fetchLostReports = async (page = 0, size = 10, filters = {}) => {
  const params = new URLSearchParams({
    page: page,
    size: size,
    sortBy: 'dateLost', 
    sortDirection: 'DESC'
  });
  const response = await api.post(`/lost-reports/filter?${params.toString()}`, filters || {});
  return response.data;
};

// Matches image_abc5ff.png (POST /lost-reports)
export const createLostReport = async (reportData) => {
  const payload = {
    title: reportData.title,
    description: reportData.description,
    dateLost: reportData.dateLost, 
    chipNumber: parseInt(reportData.chipNumber) || 0,
    species: reportData.species,
    status: reportData.status || "ACTIVE"
  };
  const response = await api.post('/lost-reports', payload);
  return response.data;
};

// Matches image_abc5e5.png (POST /lost-reports/{id}/add-image)
// EXPLICIT ENDPOINT: Upload Image for Lost Report
export const uploadLostReportImage = async (reportId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("token");

  // Hits /lost-reports/{id}/add-image
  const response = await fetch(`${BASE_URL}/lost-reports/${reportId}/add-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lost report image upload failed: ${response.status} ${errorText}`);
  }

  const contentType = response.headers.get("content-type");
  return (contentType && contentType.includes("application/json")) 
    ? await response.json() 
    : await response.text();
};

// ==========================================
//               OTHER & LINKING
// ==========================================

export const fetchMyLostReports = async () => {
  const response = await api.get(`/lost-reports?page=0&size=100&all=false`);
  return response.data;
};

export const fetchMyFoundReports = async () => {
  const response = await api.get(`/found-reports?page=0&size=100&all=false`);
  return response.data;
};

// Matches image_abc31a.png (PATCH /lost-reports/{id}/add-found-report/{id})
export const linkFoundToLostReport = async (foundReportId, lostReportId) => {
  const response = await api.patch(
    `/lost-reports/${lostReportId}/add-found-report/${foundReportId}`
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