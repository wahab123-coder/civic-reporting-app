import axios, { AxiosInstance, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request interceptor — attach token ───────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — handle 401 & refresh ──────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.data.accessToken;
        useAuthStore.getState().setTokens(newToken, data.data.refreshToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        toast.error('Session expired. Please login again.');
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-401 errors
    if (error.response?.status !== 401) {
      const msg = (error.response?.data as any)?.message;
      if (msg && typeof msg === 'string') toast.error(msg);
      else if (Array.isArray(msg)) toast.error(msg[0]);
    }

    return Promise.reject(error);
  },
);

// ── Auth ─────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

// ── Reports ───────────────────────────────────────────────
export const reportsApi = {
  getAll: (params?: any) => api.get('/reports', { params }),
  getOne: (id: string) => api.get(`/reports/${id}`),
  create: (data: any) => api.post('/reports', data),
  update: (id: string, data: any) => api.patch(`/reports/${id}`, data),
  updateStatus: (id: string, data: any) => api.patch(`/reports/${id}/status`, data),
  upvote: (id: string) => api.post(`/reports/${id}/upvote`),
  delete: (id: string) => api.delete(`/reports/${id}`),
  getMapData: () => api.get('/reports/map'),
  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get('/reports/nearby', { params: { lat, lng, radius } }),
};

// ── Media ─────────────────────────────────────────────────
export const mediaApi = {
  upload: (reportId: string, files: FileList | File[]) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    return api.post(`/media/upload/${reportId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getByReport: (reportId: string) => api.get(`/media/report/${reportId}`),
  delete: (id: string) => api.delete(`/media/${id}`),
};

// ── Comments ──────────────────────────────────────────────
export const commentsApi = {
  create: (data: any) => api.post('/comments', data),
  getByReport: (reportId: string) => api.get(`/comments/report/${reportId}`),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// ── Users ─────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  activate: (id: string) => api.patch(`/users/${id}/activate`),
  deactivate: (id: string) => api.delete(`/users/${id}/deactivate`),
  getStats: () => api.get('/users/stats'),
};

// ── Departments ───────────────────────────────────────────
export const departmentsApi = {
  getAll: () => api.get('/departments'),
  getOne: (id: string) => api.get(`/departments/${id}`),
  create: (data: any) => api.post('/departments', data),
  update: (id: string, data: any) => api.patch(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

// ── Assignments ───────────────────────────────────────────
export const assignmentsApi = {
  create: (data: any) => api.post('/assignments', data),
  getByReport: (reportId: string) => api.get(`/assignments/report/${reportId}`),
  getByDepartment: (deptId: string, params?: any) =>
    api.get(`/assignments/department/${deptId}`, { params }),
  update: (id: string, data: any) => api.patch(`/assignments/${id}`, data),
};

// ── Notifications ─────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ── Analytics ─────────────────────────────────────────────
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getReportsByMonth: (year?: number) => api.get('/analytics/reports-by-month', { params: { year } }),
  getByCategory: () => api.get('/analytics/by-category'),
  getResolutionTime: () => api.get('/analytics/resolution-time'),
  getDepartmentPerformance: () => api.get('/analytics/department-performance'),
  getStatusTrend: () => api.get('/analytics/status-trend'),
  getTopCities: (limit?: number) => api.get('/analytics/top-cities', { params: { limit } }),
  getPriorityBreakdown: () => api.get('/analytics/priority-breakdown'),
  getRecentActivity: (limit?: number) => api.get('/analytics/recent-activity', { params: { limit } }),
};
