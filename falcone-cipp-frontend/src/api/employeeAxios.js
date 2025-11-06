import axios from "axios";

// Determine backend base URL dynamically
const BASE =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
  (window.location.protocol === "https:"
    ? "https://localhost:8443"
    : "http://localhost:8443");

// Create a general axios instance for all employee/admin requests
const EMPLOYEE_API = axios.create({
  baseURL: `${BASE}/api/employees`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Attach JWT token automatically
EMPLOYEE_API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API errors gracefully
EMPLOYEE_API.interceptors.response.use(
  (res) => res,
  (err) => {
    const res = err.response;
    if (!res) console.error("Network/Server error:", err.message);
    else
      console.error(
        "Employee API error:",
        res.status,
        res.data?.error || res.data
      );
    return Promise.reject(err);
  }
);

// ---------------- API Helper Functions ---------------- //
// Employee/Admin authentication
export const registerEmployee = (data) => EMPLOYEE_API.post("/register", data);

export const loginEmployee = (credentials) => EMPLOYEE_API.post("/login", credentials);

export const getCurrentEmployee = () => EMPLOYEE_API.get("/me");

// Payment management (employee/admin privileges)
export const approveOrRejectPayment = (paymentId, decision) =>
  EMPLOYEE_API.post(`/payments/${paymentId}/decision`, { decision });

export const getPayments = () => EMPLOYEE_API.get("/payments");

// Employee management
export const getAllEmployees = () => EMPLOYEE_API.get("/employees");

export const updateEmployee = (id, data) => EMPLOYEE_API.put(`/employees/${id}`, data);

// Customer Management (admin/employee can register customers)
export const addCustomer = async (data) => {
  try {
    
    const payload = {
      username: data.username,
      name: data.name,
      surname: data.surname,
      idNumber: data.idNumber,
      phone: data.cellNumber || data.phone, 
      email: data.email,
      password: data.password,
    };

    const response = await EMPLOYEE_API.post("/customers", payload);
    return response.data;
  } catch (err) {
    console.error(
      "Add Customer API error:",
      err.response?.data?.error || err.response?.data?.message || err.message
    );
    throw err;
  }
};

// User Management - Get All Users
export const getAllUsers = async () => {
  try {
    const response = await EMPLOYEE_API.get("/users");
    return response;
  } catch (err) {
    console.error(
      "Get All Users API error:",
      err.response?.data?.error || err.message
    );
    throw err;
  }
};

// User Management - Get User Details
export const getUserDetails = async (userId) => {
  try {
    const response = await EMPLOYEE_API.get(`/users/${userId}`);
    return response;
  } catch (err) {
    console.error(
      "Get User Details API error:",
      err.response?.data?.error || err.message
    );
    throw err;
  }
};

// User Management - Delete User
export const deleteUser = async (userId) => {
  try {
    const response = await EMPLOYEE_API.delete(`/users/${userId}`);
    return response;
  } catch (err) {
    console.error(
      "Delete User API error:",
      err.response?.data?.error || err.message
    );
    throw err;
  }
};

export default EMPLOYEE_API;
// (GeeksForGeeks, 2025).