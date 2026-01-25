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
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadProfilePicture: (formData) => api.post('/auth/profile/upload-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getUserStats: () => api.get('/auth/stats'),
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
  submitQuiz: (quizId, answers, totalTimeTaken) => api.post(`/user/quiz/${quizId}/submit`, { answers, totalTimeTaken }),
  getResultDetails: (resultId) => api.get(`/user/quiz/result/${resultId}`),
  getQuizHistory: () => api.get('/user/quiz/history'),
  deleteResult: (resultId) => api.delete(`/user/quiz/result/${resultId}`),
};

// Contest APIs (Admin)
export const adminContestAPI = {
  createContest: (data) => api.post('/contest/admin/create', data),
  uploadQuestionImage: (formData) => api.post('/contest/admin/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyContests: () => api.get('/contest/admin/my-contests'),
  getContestById: (contestId) => api.get(`/contest/admin/${contestId}`),
  updateContest: (contestId, data) => api.put(`/contest/admin/${contestId}`, data),
  deleteContest: (contestId) => api.delete(`/contest/admin/${contestId}`),
  getLeaderboard: (contestId) => api.get(`/contest/admin/${contestId}/leaderboard`),
};

// Contest APIs (User)
export const contestAPI = {
  getAllContests: () => api.get('/contest/all'),
  getContestForAttempt: (contestId) => api.get(`/contest/${contestId}/attempt`),
  submitContest: (contestId, data) => api.post(`/contest/${contestId}/submit`, data),
  getLeaderboard: (contestId) => api.get(`/contest/${contestId}/leaderboard`),
  getMyHistory: () => api.get('/contest/history'),
  getResultDetails: (resultId) => api.get(`/contest/result/${resultId}`),
};

export default api;
