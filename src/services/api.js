import axios from 'axios';

const BASE_URL = import.meta.env.VITE_SPRING_BOOT_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

//Add Token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  console.log("---------------- REQUEST DEBUG ----------------");
  console.log("URL:", config.url);
  console.log("Token found in storage:", token ? "YES" : "NO");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Attaching Header:", config.headers.Authorization);
  } else {
    console.warn("⚠️ Sending request without token! (Expect 403)");
  }
  console.log("-----------------------------------------------");
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

//AUTH
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

//FOUND REPORTS
// POST /found-reports/filter
export const fetchFoundReports = async (page = 0, size = 10, filters = {}) => {
  const params = new URLSearchParams({
    page: page,
    size: size,
    sortBy: 'dateFound', 
    sortDirection: 'DESC'
  });

  const body = filters || {};

  const response = await api.post( `/found-reports/filter?${params.toString()}`, body);
  return response.data;
};

//LOST REPORTS
// GET /lost-reports
export const fetchMyLostReports = async () => {
  const response = await api.get(`/lost-reports?page=0&size=100&all=false`);
  return response.data;
};

//LINK PET
// PATCH /found-reports/{id}/add-lost-report/{id}
export const linkFoundToLostReport = async (foundReportId, lostReportId) => {
  const response = await api.patch(
    `/found-reports/${foundReportId}/add-lost-report/${lostReportId}`
  );
  return response.data;
};

export default api;