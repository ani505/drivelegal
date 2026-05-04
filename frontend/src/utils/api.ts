import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token on every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dl_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error normalisation
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login:       (body: unknown)                => api.post('/auth/login', body),
  register:    (body: unknown)                => api.post('/auth/register', body),
  googleLogin: (body: { credential: string }) => api.post('/auth/google', body),
  me:          ()                             => api.get('/auth/me'),
};

// ─── Typed helpers ────────────────────────────────────────────────────────────

export const violationsApi = {
  list: (params: Record<string, unknown>) => api.get('/violations/', { params }),
  get:  (id: number)                       => api.get(`/violations/${id}`),
  estimateFine: (body: unknown)            => api.post('/violations/estimate-fine', body),
  categories: ()                           => api.get('/violations/categories/list'),
};

export const chatApi = {
  sendMessage: (body: unknown)             => api.post('/chat/message', body),
  suggested:   (country_code?: string)     => api.get('/chat/suggested-questions', { params: { country_code } }),
};

export const documentsApi = {
  uploadCitation: (formData: FormData)     => api.post('/documents/upload-citation', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const geoApi = {
  detect:           ()                     => api.get('/geo/detect'),
  enforcementZones: (params: unknown)      => api.get('/geo/enforcement-zones', { params }),
};

export const profileApi = {
  me:         ()                           => api.get('/profile/me'),
  riskScore:  ()                           => api.get('/profile/risk-score'),
  violations: ()                           => api.get('/profile/violations'),
};

export const lawyersApi = {
  list: (params: unknown)                  => api.get('/lawyers', { params }),
};

export const appealApi = {
  guidance: (body: unknown)               => api.post('/appeal/guidance', body),
};
