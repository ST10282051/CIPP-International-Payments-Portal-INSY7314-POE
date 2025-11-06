import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CreditCard, History, User, AlertCircle, Check, X, TrendingUp, List } from "lucide-react";
import employeeAPI, { getPayments, approveOrRejectPayment } from "../api/employeeAxios";
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [processedPayments, setProcessedPayments] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments();
      const data = res.data || [];
      setPayments(data);
      setProcessedPayments(data.filter((p) => p.status === "approved").length);
    } catch (err) {
      console.error("Failed to fetch payments:", err.response?.data || err.message);
      alert("Error fetching payments. Check your login or API access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (paymentId, decision) => {
    try {
      await approveOrRejectPayment(paymentId, decision);
      setPayments((prev) =>
        prev.map((p) => (p._id === paymentId ? { ...p, status: decision } : p))
      );
      setProcessedPayments((prev) => (decision === "approved" ? prev + 1 : prev));
    } catch (err) {
      console.error("Failed to update payment:", err.response?.data || err.message);
      alert("Failed to update payment status");
    }
  };

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const handleViewPending = () => navigate("/employee/pending");
  const handleViewAllPayments = () => navigate("/employee/all-payments");

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Employee Dashboard</h1>
            <p className="dashboard-subtitle">Monitor and manage payment transactions</p>
          </div>
          <div className="header-actions">
            <button
              onClick={handleViewAllPayments}
              className="btn btn-secondary"
            >
              <List className="btn-icon" />
              All Payments
            </button>
            <button
              onClick={() => navigate("/employee/add-customer")}
              className="btn btn-primary"
            >
              <User className="btn-icon" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper stat-icon-blue">
                <CreditCard className="stat-icon" />
              </div>
              <div className="stat-trend">
                <TrendingUp className="trend-icon" />
              </div>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Total Payments</h3>
              <p className="stat-value">{payments.length}</p>
              <p className="stat-description">All time transactions</p>
            </div>
          </div>

          <div className="stat-card stat-card-green">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper stat-icon-green">
                <History className="stat-icon" />
              </div>
              <div className="stat-trend">
                <TrendingUp className="trend-icon" />
              </div>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Approved</h3>
              <p className="stat-value">{processedPayments}</p>
              <p className="stat-description">Successfully processed</p>
            </div>
          </div>

          <div className="stat-card stat-card-yellow">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper stat-icon-yellow">
                <User className="stat-icon" />
              </div>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Pending Approval</h3>
              <p className="stat-value">
                {payments.filter((p) => p.status === "pending").length}
              </p>
              <p className="stat-description">Awaiting review</p>
            </div>
            <button
              className="btn btn-warning btn-full-width"
              onClick={handleViewPending}
            >
              View Pending Payments
            </button>
          </div>
        </div>

        {/* Recent Payments Section */}
        <div className="recent-payments-section">
          <div className="section-header">
            <h2 className="section-title">Recent Payments</h2>
            <div className="section-badge">Last 5 transactions</div>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading payments...</p>
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <AlertCircle className="icon-xl" />
              </div>
              <h3 className="empty-state-title">No payments yet</h3>
              <p className="empty-state-description">
                Payment transactions will appear here once they are created
              </p>
            </div>
          ) : (
            <div className="payments-list">
              {recentPayments.map((p) => (
                <div key={p._id} className="payment-card">
                  <div className="payment-info">
                    <div className="payment-user-section">
                      <div className="user-avatar">
                        {(p.fromUser?.username || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <p className="payment-user">{p.fromUser?.username || "Unknown User"}</p>
                        <p className="payment-date">
                          {p.createdAt ? new Date(p.createdAt).toLocaleString() : "No Date"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="payment-actions">
                    <div className="payment-amount-section">
                      <p className="payment-currency">{p.currency}</p>
                      <p className="payment-amount">{p.amount}</p>
                    </div>
                    
                    <div className="payment-status-section">
                      <span className={`status-badge status-${p.status || "unknown"}`}>
                        {p.status || "Unknown"}
                      </span>
                      
                      {p.status === "pending" && (
                        <div className="action-buttons">
                          <button
                            onClick={() => handleDecision(p._id, "approved")}
                            className="btn btn-success btn-sm"
                          >
                            <Check className="btn-icon-sm" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(p._id, "rejected")}
                            className="btn btn-danger btn-sm"
                          >
                            <X className="btn-icon-sm" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
// (Code Bless You , 2025). 