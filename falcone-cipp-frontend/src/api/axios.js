import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "https://localhost:8443";

// --------------------
// Create a single Axios instance template
// --------------------
const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
  withCredentials: true, // allows cookies if backend uses them
});

// --------------------
// Request interceptor (JWT token)
// --------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --------------------
// Global response interceptor
// --------------------
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) console.error("Network/Server error:", err.message);
    else console.error("API error:", err.response.status, err.response.data?.error || err.response.data);
    return Promise.reject(err);
  }
);

// --------------------
// AUTH
// --------------------
export const loginCustomer = (credentials) => api.post("/api/auth/login", credentials);
export const registerCustomer = (data) => api.post("/api/auth/register", data);

// --------------------
// CUSTOMERS / CARDS
// --------------------
export const getCards = () => api.get("/api/customers/cards");
export const addCard = (card) => api.post("/api/customers/cards", card);
export const deleteCard = (id) => api.delete(`/api/customers/cards/${id}`);

// --------------------
// PAYMENTS
// --------------------
export const getPayments = () => api.get("/api/customers/payments");
export const createPayment = (data) => api.post("/api/customers/payments", data);

// --------------------
// PROFILE
// --------------------
export const getProfile = () => api.get("/api/customers/profile");
export const updateProfile = (data) => {
  const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  return api.put("/api/customers/profile", data, config);
};

export default api;
