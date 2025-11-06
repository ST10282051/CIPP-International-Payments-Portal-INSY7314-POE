import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import PendingPayments from "./pages/PendingPayments";
import AllPayments from "./pages/AllPayments";
import UserPaymentHistory from "./pages/UserPaymentHistory";
import PaymentForm from "./pages/PaymentForm";
import PaymentHistory from "./pages/PaymentHistory"; 
import AddCustomer from "./pages/AddCustomer";
import AllUsers from "./pages/AllUsers";
import UserDetails from "./pages/UserDetails";
import ProfilePage from "./pages/ProfilePage"; 
import ProtectedRoute from "./components/ProtectedRoute";
import api, { getPayments } from "./api/axios";

export default function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [paymentPrefillCard, setPaymentPrefillCard] = useState(null);

  const navigate = useNavigate();

  // Fetch customer payments
  const fetchCustomerPayments = async () => {
    try {
      const res = await getPayments();
      const fetchedPayments = res.data || [];
      // Sort by date (newest first)
      fetchedPayments.sort((a, b) => 
        new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );
      setTransactions(fetchedPayments);
      return fetchedPayments;
    } catch (err) {
      console.error("Failed to fetch payments:", err.response?.data || err.message);
      return [];
    }
  };

  // Load token and user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role);

      if (payload.role === "customer") {
        setUser({
          id: payload.id,
          username: payload.username,
          email: payload.email,
          cards: payload.cards || [],
        });

        // Fetch customer payments
        fetchCustomerPayments();
      } else if (payload.role === "employee" || payload.role === "admin") {
        setUser({
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
        });
      }
    } catch (err) {
      console.error("Invalid token:", err);
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setRole(null);
    setUser({});
    setTransactions([]);
    navigate("/");
  };

  // Customer navigation
  const handleNavigate = (view, options = {}) => {
    if (view === "payment") {
      setPaymentPrefillCard(options.prefillCard || null);
      navigate("/payment");
    } else if (view === "history") {
      navigate("/payment-history");
    }
  };

  // Handle adding a new transaction and refresh payment list
  const handleAddTransaction = async (tx, updatedCards = null) => {
    // Add the new transaction immediately for instant feedback
    setTransactions((prev) => [tx, ...prev]);
    
    // Update cards if provided
    if (updatedCards) {
      setUser((prev) => ({ ...prev, cards: updatedCards }));
    }
    
    // Refresh the full payment list from server to ensure sync
    setTimeout(() => {
      fetchCustomerPayments();
    }, 1000);
  };

  const handleBackToDashboard = () => {
    setPaymentPrefillCard(null);
    // Refresh payments when returning to dashboard
    fetchCustomerPayments();
    navigate("/customer");
  };

  // Refresh payments function to be passed to child components
  const refreshPayments = () => {
    return fetchCustomerPayments();
  };

  /* -------------------- Routes -------------------- */
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Customer routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard
              user={user}
              transactions={transactions}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              refreshPayments={refreshPayments}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/profile" 
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <PaymentForm
              prefillCard={paymentPrefillCard}
              onBack={handleBackToDashboard}
              onAddTransaction={handleAddTransaction}
              onUpdateCards={(cards) => setUser((prev) => ({ ...prev, cards }))}
              refreshPayments={refreshPayments}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-history"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <PaymentHistory 
              onBack={handleBackToDashboard}
              refreshPayments={refreshPayments}
            />
          </ProtectedRoute>
        }
      />

      {/* Employee/admin routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["employee", "admin"]}>
            <EmployeeDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/pending"
        element={
          <ProtectedRoute allowedRoles={["employee", "admin"]}>
            <PendingPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/all-payments"
        element={
          <ProtectedRoute allowedRoles={["employee", "admin"]}>
            <AllPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/user-payments/:userId"
        element={
          <ProtectedRoute allowedRoles={["employee", "admin"]}>
            <UserPaymentHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/add-customer"
        element={
          <ProtectedRoute allowedRoles={["employee", "admin"]}>
            <AddCustomer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/all-users"
        element={
          <ProtectedRoute allowedRoles={["employee", "admin"]}>
            <AllUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/user-details/:userId"
        element={
          <ProtectedRoute allowedRoles={["employee", "admin"]}>
            <UserDetails />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
