import axios from 'axios';

// Vite uses import.meta.env for environment variables
// VITE_API_URL should be set to your backend URL (e.g., https://api-hestim.render.com)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
});

export default apiClient;
