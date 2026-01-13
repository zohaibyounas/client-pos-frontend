import axios from 'axios';

const api = axios.create({
    baseURL: 'https://8960db44-d386-48bc-904e-499f3d8fdee2-00-1wlaoh0fovpl5.pike.replit.dev/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
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

export default api;
