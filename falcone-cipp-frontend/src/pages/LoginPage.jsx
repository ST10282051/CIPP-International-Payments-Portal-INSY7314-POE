// frontend/src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginCustomer } from "../api/axios"; // customer login
import { loginEmployee } from "../api/employeeAxios"; // employee/admin login
import "./LoginPage.css";
import "../api/testApi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { email, password };

      // Identify account type by email domain
      const isEmployee = email.toLowerCase().endsWith("@falconecipp.co.za");

      const res = isEmployee
        ? await loginEmployee(payload)
        : await loginCustomer(payload);

      const data = res.data;
      const token = data.token;

      if (!token) throw new Error("Authentication token missing");

      // Save token securely
      localStorage.setItem("token", token);

      // Determine route based on role
      if (isEmployee) {
        const role = data.employee?.role || "employee";
        if (role === "admin") navigate("/employee");
        else navigate("/employee");
      } else {
        navigate("/customer");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-decoration">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
      </div>

      <div className="login-wrapper">
        <div className="login-brand">
          <div className="brand-icon-wrapper">
            <div className="brand-icon">
              <Shield className="shield-icon" />
            </div>
          </div>
          <h1 className="brand-title">Falcone CIPP</h1>
          <p className="brand-subtitle">Secure Payment Gateway</p>
        </div>

        <div className="login-card">
          <h2 className="login-title">Welcome Back</h2>

          {error && (
            <div className="error-alert">
              <AlertCircle className="error-icon" />
              <p className="error-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="eye-icon" />
                  ) : (
                    <Eye className="eye-icon" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Shield className="button-icon" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="security-badge">
          <Lock className="security-icon" />
          <span className="security-text">
            Secured with 256-bit encryption
          </span>
        </div>
      </div>
    </div>
  );
}
// (Code Bless You, 2025)
