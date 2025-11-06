import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { getPayments } from "../api/employeeAxios";
import "./UserPaymentHistory.css";

const UserPaymentHistory = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || "User";

  const [userPayments, setUserPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all payments and filter by user
  const fetchUserPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments();
      const allPayments = res.data || [];
      
      // Filter payments for this specific user
      const filtered = allPayments.filter(
        (payment) => payment.fromUser?._id === userId
      );
      
      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setUserPayments(filtered);
    } catch (err) {
      console.error("Failed to fetch user payments:", err.response?.data || err.message);
      alert("Error fetching user payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPayments();
  }, [userId]);

  // Calculate statistics
  const stats = {
    total: userPayments.length,
    totalAmount: userPayments.reduce((sum, p) => sum + p.amount, 0),
    pending: userPayments.filter((p) => p.status === "pending").length,
    approved: userPayments.filter((p) => p.status === "approved").length,
    rejected: userPayments.filter((p) => p.status === "rejected").length,
  };

  // Get unique cards used
  const uniqueCards = [
    ...new Map(
      userPayments
        .filter((p) => p.card)
        .map((p) => [p.card._id, p.card])
    ).values(),
  ];

  return (
    <div className="user-payments-wrapper">
      <Navbar />
      <div className="user-payments-container">
        {/* Header with Back Button */}
        <div className="user-payments-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            <ArrowLeft className="back-icon" />
            Back to All Payments
          </button>
          <div className="header-title-section">
            <div className="user-avatar-large">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="header-text">
              <h1 className="user-page-title">Payment History: {username}</h1>
              <p className="user-page-subtitle">
                Complete transaction history for this customer
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="user-stats-grid">
          <div className="user-stat-card card-purple">
            <div className="stat-header">
              <div className="stat-icon-circle">
                <CreditCard className="stat-icon" />
              </div>
              <TrendingUp className="trend-icon" />
            </div>
            <div className="stat-body">
              <p className="stat-label">Total Transactions</p>
              <p className="stat-value">{stats.total}</p>
            </div>
          </div>

          <div className="user-stat-card card-green">
            <div className="stat-header">
              <div className="stat-icon-circle">
                <DollarSign className="stat-icon" />
              </div>
              <TrendingUp className="trend-icon" />
            </div>
            <div className="stat-body">
              <p className="stat-label">Total Amount</p>
              <p className="stat-value">${stats.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="user-stat-card card-blue">
            <div className="stat-header">
              <div className="stat-icon-circle">
                <User className="stat-icon" />
              </div>
            </div>
            <div className="stat-body">
              <p className="stat-label">Approved</p>
              <p className="stat-value">{stats.approved}</p>
            </div>
          </div>

          <div className="user-stat-card card-orange">
            <div className="stat-header">
              <div className="stat-icon-circle">
                <AlertCircle className="stat-icon" />
              </div>
            </div>
            <div className="stat-body">
              <p className="stat-label">Pending</p>
              <p className="stat-value">{stats.pending}</p>
            </div>
          </div>
        </div>

        {/* Cards Used Section */}
        {uniqueCards.length > 0 && (
          <div className="cards-section">
            <h2 className="section-title">Payment Methods Used</h2>
            <div className="cards-grid">
              {uniqueCards.map((card) => (
                <div key={card._id} className="card-item">
                  <div className="card-icon-wrapper">
                    <CreditCard className="card-item-icon" />
                  </div>
                  <div className="card-details">
                    <p className="card-holder">{card.cardHolder}</p>
                    <p className="card-number">{card.cardNumber}</p>
                    <p className="card-expiry">
                      Expires: {card.expiryMonth}/{card.expiryYear}
                    </p>
                  </div>
                  <div className="card-usage">
                    <span className="usage-badge">
                      {
                        userPayments.filter((p) => p.card?._id === card._id)
                          .length
                      }{" "}
                      transactions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History Table */}
        <div className="payment-history-section">
          <h2 className="section-title">Transaction History</h2>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading payment history...</p>
            </div>
          ) : userPayments.length === 0 ? (
            <div className="empty-state">
              <AlertCircle className="empty-icon" />
              <h3 className="empty-title">No payment history</h3>
              <p className="empty-description">
                This user hasn't made any payments yet
              </p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>To Account</th>
                    <th>Amount</th>
                    <th>Card Used</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userPayments.map((payment) => (
                    <tr key={payment._id} className="history-row">
                      <td>
                        <div className="date-column">
                          <Calendar className="date-icon-small" />
                          <div className="date-info">
                            <span className="date-main">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </span>
                            <span className="date-time">
                              {new Date(payment.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="account-display">
                          {payment.toAccount}
                        </span>
                      </td>
                      <td>
                        <div className="amount-column">
                          <span className="currency-label">
                            {payment.currency}
                          </span>
                          <span className="amount-number">
                            {payment.amount.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="card-column">
                          <CreditCard className="card-icon-small" />
                          <div className="card-info-inline">
                            <span className="card-name">
                              {payment.card?.cardHolder || "N/A"}
                            </span>
                            <span className="card-num">
                              {payment.card?.cardNumber || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge-history status-${payment.status}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPaymentHistory;
// (Code Bless You , 2025). 