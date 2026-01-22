import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Admin Quiz APIs
export const adminQuizAPI = {
  createQuiz: (data) => api.post('/admin/quiz/create', data),
  uploadQuestionImage: (formData) => api.post('/admin/quiz/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyQuizzes: () => api.get('/admin/quiz/my-quizzes'),
  updateQuiz: (quizId, data) => api.put(`/admin/quiz/${quizId}`, data),
  deleteQuiz: (quizId) => api.delete(`/admin/quiz/${quizId}`),
  getQuizById: (quizId) => api.get(`/admin/quiz/${quizId}`),
};

// User Quiz APIs
export const userQuizAPI = {
  getAllQuizzes: () => api.get('/user/quiz/all'),
  getQuizForAttempt: (quizId) => api.get(`/user/quiz/${quizId}/attempt`),
  submitQuiz: (quizId, answers) => api.post(`/user/quiz/${quizId}/submit`, { answers }),
  getResultDetails: (resultId) => api.get(`/user/quiz/result/${resultId}`),
  getQuizHistory: () => api.get('/user/quiz/history'),
  deleteResult: (resultId) => api.delete(`/user/quiz/result/${resultId}`),
};

export default api;
