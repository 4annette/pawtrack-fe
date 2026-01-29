import axios from 'axios';
import { messaging, auth } from '../firebase/firebaseInitialization';
import { getToken } from 'firebase/messaging';
import { signOut } from 'firebase/auth';

const BASE_URL = import.meta.env.VITE_SPRING_BOOT_API_URL;
const VAPID_KEY = "BItYFdZE3jbFMTOsNkDtLBYy5c4Y7CzPxR8khsBeVgJ1883Hj5XCf8zZoaQ6oyEB-BLiyOOGN6IjNiC727kHSi4";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    const cleanToken = token.replace(/"/g, '');
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ==========================================
//                AUTH & FCM
// ==========================================

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const syncFcmToken = async () => {
  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      await api.post('/users/add-fcm-token', null, {
        params: { fcmToken: currentToken }
      });
    }
  } catch (error) {
    console.error("FCM Sync Error:", error);
  }
};

export const logoutUser = async () => {
  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (currentToken) {
      try {
        await api.delete('/users/delete-fcm-token', {
          params: { fcmToken: currentToken }
        });
      } catch (e) {
        console.warn("Failed to delete FCM token", e);
      }
    }

    try {
      await api.post('/users/logout');
    } catch (e) {
      console.warn("Backend logout failed", e);
    }

    await signOut(auth);
    localStorage.removeItem('token');

  } catch (error) {
    console.error("Logout Error:", error);
    localStorage.removeItem('token');
  }
};

// ==========================================
//                NOTIFICATIONS
// ==========================================

export const fetchNotifications = async () => {
  const response = await api.get('/users/notifications');
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/users/notifications/${notificationId}/read`);
  return response.data;
};

// ==========================================
//                STATISTICS
// ==========================================

export const fetchStatistics = async () => {
  const response = await api.get('/statistics');
  return response.data;
};

// ==========================================
//                FOUND REPORTS
// ==========================================

export const fetchFoundReports = async (page = 0, size = 10, filters = {}, sortBy = 'dateFound', sortDirection = 'DESC') => {
  const response = await api.post(`/found-reports/filter`, filters || {}, {
    params: { page, size, sortBy, sortDirection }
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
//                LOST REPORTS
// ==========================================

export const fetchLostReports = async (page = 0, size = 10, filters = {}, sortBy = 'dateLost', sortDirection = 'DESC') => {
  const response = await api.post(`/lost-reports/filter`, filters || {}, {
    params: { page, size, sortBy, sortDirection }
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

export const toggleLostReportFoundStatus = async (id, status) => {
  const response = await api.patch(`/lost-reports/${id}/toggle-found`, null, {
    params: { found: status }
  });
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
//           USER & PROFILE ACTIONS
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

export const changePassword = async (passwordData) => {
  const response = await api.patch('/users/change-password', passwordData);
  return response.data;
};

export const changeUsername = async (username) => {
  const response = await api.patch('/users/change-username', null, {
    params: { username }
  });
  return response.data;
};

// ==========================================
//                MY REPORTS
// ==========================================
export const fetchMyLostReportsList = async (page = 0, size = 5, sortBy = 'lostDate', direction = 'desc') => {
  const response = await api.get(`/lost-reports?page=${page}&size=${size}&sort=${sortBy},${direction}&all=false`);
  return response.data;
};

export const fetchMyFoundReportsList = async (page = 0, size = 5, sortBy = 'foundDate', direction = 'desc') => {
  const response = await api.get(`/found-reports?page=${page}&size=${size}&sort=${sortBy},${direction}&all=false`);
  return response.data;
};

export const fetchMyLostReports = fetchMyLostReportsList;
export const fetchMyFoundReports = fetchMyFoundReportsList;

// ==========================================
//                LINKING
// ==========================================
export const linkFoundToLostReport = async (foundReportId, lostReportId) => {
  const response = await api.patch(`/lost-reports/${lostReportId}/add-found-report/${foundReportId}`);
  return response.data;
};

export const removeFoundReportFromLostReport = async (lostReportId, foundReportId) => {
  const response = await api.patch(`/lost-reports/${lostReportId}/remove-found-report/${foundReportId}`);
  return response.data;
};

export const addLostReportToFoundReport = async (foundReportId, lostReportId) => {
  const response = await api.patch(`/found-reports/${foundReportId}/add-lost-report/${lostReportId}`);
  return response.data;
};

export const connectFoundReports = async (foundReportId, connectedFoundReportId) => {
  const response = await api.patch(`/found-reports/${foundReportId}/add-found-report/${connectedFoundReportId}`);
  return response.data;
};

export const disconnectFoundReports = async (foundReportId, connectedFoundReportId) => {
  const response = await api.patch(`/found-reports/${foundReportId}/remove-found-report/${connectedFoundReportId}`);
  return response.data;
};

export const confirmLostReportMatch = async (lostReportId) => {
  const response = await api.patch(`/lost-reports/${lostReportId}/there-are-connected-found-reports`);
  return response.data;
};

export const markLostReportAsFound = async (lostReportId) => {
  const response = await api.patch(`/lost-reports/${lostReportId}/found`);
  return response.data;
};

export default api;