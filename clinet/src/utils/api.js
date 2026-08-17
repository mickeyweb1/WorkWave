import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'https://workwave-api-8fyj.onrender.com/api'; // 👈 Your Render URL

const api = axios.create({ baseURL });

api.interceptors.request.use((req) => {
  const token = localStorage.getItem('workwave_token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default api;
