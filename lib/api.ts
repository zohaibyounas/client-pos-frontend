import axios from "axios";

const api = axios.create({
  // baseURL: "https://client-pos-backend.onrender.com/api",
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});
//dddd
// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const storeData = localStorage.getItem("selectedStore");
    if (storeData) {
      try {
        const store = JSON.parse(storeData);
        if (store && store._id) {
          config.headers["x-store-id"] = store._id;
        }
      } catch (e) {
        console.error("Failed to parse selectedStore from localStorage", e);
        // Optionally clear invalid data
        // localStorage.removeItem("selectedStore");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
