import axios from 'axios';

const BASE_URL = import.meta.env.VITE_SPRING_BOOT_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- INTERCEPTOR (Token Cleaner) ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    const cleanToken = token.replace(/"/g, ''); 
    config.headers.Authorization = `Bearer ${cleanToken}`;
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
//                 FOUND REPORTS
// ==========================================

export const fetchFoundReports = async (page = 0, size = 10, filters = {}, sortBy = 'dateFound') => {
  const response = await api.post(`/found-reports/filter`, filters || {}, {
    params: { page, size, sortBy, sortDirection: 'DESC' }
  });
  return response.data;
};

export const fetchFoundReportById = async (id) => {
  const response = await api.get(`/found-reports/${id}`);
  return response.data;
};

export const createFoundReport = async (reportData) => {
  const payload = {
    title: reportData.title,
    description: reportData.description,
    dateFound: reportData.dateFound, 
    chipNumber: parseInt(reportData.chipNumber) || 0,
    species: reportData.species,
    condition: reportData.condition,
    latitude: reportData.latitude,
    longitude: reportData.longitude
  };
  const response = await api.post('/found-reports', payload);
  return response.data;
};

export const updateFoundReport = async (id, data) => {
  const response = await api.put(`/found-reports/${id}`, data);
  return response.data;
};

export const deleteFoundReport = async (id) => {
  const response = await api.delete(`/found-reports/${id}`);
  return response.data;
};

export const uploadFoundReportImage = async (reportId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  let token = localStorage.getItem("token");
  if (token) token = token.replace(/"/g, ''); 

  const response = await fetch(`${BASE_URL}/found-reports/${reportId}/add-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) throw new Error(`Upload failed`);
  const contentType = response.headers.get("content-type");
  return (contentType && contentType.includes("application/json")) ? await response.json() : await response.text();
};

export const deleteFoundReportImage = async (id) => {
  const response = await api.delete(`/found-reports/${id}/delete-image`);
  return response.data;
};

// ==========================================
//                 LOST REPORTS
// ==========================================

export const fetchLostReports = async (page = 0, size = 10, filters = {}, sortBy = 'dateLost') => {
  const response = await api.post(`/lost-reports/filter`, filters || {}, {
    params: { page, size, sortBy, sortDirection: 'DESC' }
  });
  return response.data;
};

export const fetchLostReportById = async (id) => {
  const response = await api.get(`/lost-reports/${id}`);
  return response.data;
};

export const createLostReport = async (reportData) => {
  const payload = {
    title: reportData.title,
    description: reportData.description,
    species: reportData.species,
    chipNumber: parseInt(reportData.chipNumber) || 0,
    date: reportData.date,
    latitude: reportData.latitude,
    longitude: reportData.longitude
  };
  const response = await api.post('/lost-reports', payload);
  return response.data;
};

export const updateLostReport = async (id, data) => {
  const response = await api.put(`/lost-reports/${id}`, data);
  return response.data;
};

export const deleteLostReport = async (id) => {
  const response = await api.delete(`/lost-reports/${id}`);
  return response.data;
};

export const uploadLostReportImage = async (reportId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  let token = localStorage.getItem("token");
  if (token) token = token.replace(/"/g, ''); 

  const response = await fetch(`${BASE_URL}/lost-reports/${reportId}/add-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) throw new Error(`Upload failed`);
  const contentType = response.headers.get("content-type");
  return (contentType && contentType.includes("application/json")) ? await response.json() : await response.text();
};

export const deleteLostReportImage = async (id) => {
  const response = await api.delete(`/lost-reports/${id}/delete-image`);
  return response.data;
};

// ==========================================
//          USER & PROFILE ACTIONS
// ==========================================
export const fetchCurrentUser = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const updateUserProfile = async (userData) => {
  const response = await api.put('/users', userData);
  return response.data;
};

export const deleteUserAccount = async (userId) => {
  const response = await api.delete(`/users?userId=${userId}`);
  return response.data;
};

// ==========================================
//       MY REPORTS
// ==========================================
export const fetchMyLostReportsList = async (page = 0, size = 5, sortBy = 'lostDate') => {
  const response = await api.get(`/lost-reports?page=${page}&size=${size}&sort=${sortBy},desc&all=false`);
  return response.data;
};

export const fetchMyFoundReportsList = async (page = 0, size = 5, sortBy = 'foundDate') => {
  const response = await api.get(`/found-reports?page=${page}&size=${size}&sort=${sortBy},desc&all=false`);
  return response.data;
};

export const fetchMyLostReports = fetchMyLostReportsList;
export const fetchMyFoundReports = fetchMyFoundReportsList;

// ==========================================
//                 LINKING
// ==========================================
export const linkFoundToLostReport = async (foundReportId, lostReportId) => {
  const response = await api.patch(`/lost-reports/${lostReportId}/add-found-report/${foundReportId}`);
  return response.data;
};

export const connectFoundReports = async (foundReportId, connectedFoundReportId) => {
  const response = await api.patch(`/found-reports/${foundReportId}/add-found-report/${connectedFoundReportId}`);
  return response.data;
};

export default api;