import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPayments, getCards } from "../api/axios";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";
import "./PaymentHistory.css";

export default function PaymentHistory({ onBack }) {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [paymentsRes, cardsRes] = await Promise.all([
          getPayments(),
          getCards(),
        ]);

        const fetchedPayments = Array.isArray(paymentsRes.data)
          ? paymentsRes.data
          : [];

        // Sort by date (newest first)
        fetchedPayments.sort(
          (a, b) =>
            new Date(b.createdAt || b.date || 0) -
            new Date(a.createdAt || a.date || 0)
        );

        setPayments(fetchedPayments);
        setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
      } catch (err) {
        console.error("Failed to fetch payment data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Stats summary
  const stats = {
    total: payments.length,
    totalAmount: payments.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    ),
    pending: payments.filter(
      (p) => p.status?.toLowerCase() === "pending"
    ).length,
    success: payments.filter((p) =>
      ["success", "approved", "completed"].includes(
        p.status?.toLowerCase()
      )
    ).length,
    failed: payments.filter((p) =>
      ["failed", "rejected"].includes(p.status?.toLowerCase())
    ).length,
  };

  // Unique cards used
  const uniqueCards = [
    ...new Map(
      payments
        .filter((p) => p.card)
        .map((p) => [p.card._id || p.card.cardNumber, p.card])
    ).values(),
  ];

  // Filter payments by status
  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    const status = p.status?.toLowerCase();
    if (filter === "completed")
      return ["success", "approved", "completed"].includes(status);
    return status === filter;
  });

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/customer");
  };

  if (loading) {
    return (
      <div className="payment-history-loading">
        <div className="loading-spinner-large" />
        <p className="loading-text">Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="user-payments-wrapper">
      <div className="user-payments-container">
        {/* Header */}
        <div className="user-payments-header">
          <button onClick={handleBack} className="btn-back">
            <ArrowLeft className="back-icon" />
            Back to Dashboard
          </button>
          <div className="header-title-section">
            <div className="user-avatar-large">
              <CreditCard style={{ width: 40, height: 40 }} />
            </div>
            <div className="header-text">
              <h1 className="user-page-title">My Payment History</h1>
              <p className="user-page-subtitle">
                Complete overview of your transactions
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="user-stats-grid">
          <StatCard
            icon={<CreditCard />}
            label="Total Transactions"
            value={stats.total}
            color="purple"
          />
          <StatCard
            icon={<DollarSign />}
            label="Total Amount"
            value={`R ${stats.totalAmount.toFixed(2)}`}
            color="green"
          />
          <StatCard
            icon={<CheckCircle />}
            label="Successful"
            value={stats.success}
            color="blue"
          />
          <StatCard
            icon={<Clock />}
            label="Pending"
            value={stats.pending}
            color="orange"
          />
        </div>

        {/* Cards Used */}
        {uniqueCards.length > 0 && (
          <div className="cards-section">
            <h2 className="section-title">Payment Methods</h2>
            <div className="cards-grid">
              {uniqueCards.map((card, idx) => (
                <div key={card._id || idx} className="card-item">
                  <div className="card-icon-wrapper">
                    <CreditCard className="card-item-icon" />
                  </div>
                  <div className="card-details">
                    <p className="card-holder">
                      {card.cardHolder || "Unnamed Holder"}
                    </p>
                    <p className="card-number">
                      {card.cardNumber || "**** **** **** ****"}
                    </p>
                    <p className="card-expiry">
                      Expires: {card.expiryMonth || "??"}/
                      {card.expiryYear || "??"}
                    </p>
                  </div>
                  <div className="card-usage">
                    <span className="usage-badge">
                      {
                        payments.filter(
                          (p) =>
                            p.card?.cardNumber === card.cardNumber
                        ).length
                      }{" "}
                      transactions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="payment-history-section">
          <div className="section-header-with-filters">
            <h2 className="section-title">Transaction History</h2>
            <div className="filter-buttons-inline">
              {["all", "completed", "pending", "failed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`filter-btn-small ${
                    filter === status
                      ? "filter-btn-small-active"
                      : ""
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="empty-state">
              <AlertCircle className="empty-icon" />
              <h3 className="empty-title">
                {filter === "all"
                  ? "No payment history"
                  : `No ${filter} payments`}
              </h3>
              <p className="empty-description">
                {filter === "all"
                  ? "Your transactions will appear here."
                  : `You don’t have any ${filter} payments yet.`}
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
                  {filteredPayments.map((payment, idx) => {
                    const date = new Date(
                      payment.createdAt || payment.date
                    );
                    const status =
                      payment.status?.toLowerCase() || "pending";

                    return (
                      <tr
                        key={payment._id || payment.id || idx}
                        className="history-row"
                      >
                        <td>
                          <div className="date-column">
                            <Calendar className="date-icon-small" />
                            <div className="date-info">
                              <span className="date-main">
                                {date.toLocaleDateString("en-ZA")}
                              </span>
                              <span className="date-time">
                                {date.toLocaleTimeString("en-ZA")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="account-display">
                            {payment.toAccount || "N/A"}
                          </span>
                        </td>
                        <td>
                          <div className="amount-column">
                            <span className="currency-label">
                              {payment.currency || "ZAR"}
                            </span>
                            <span className="amount-number">
                              {parseFloat(payment.amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="card-column">
                            <CreditCard className="card-icon-small" />
                            <div className="card-info-inline">
                              <span className="card-name">
                                {payment.card?.cardHolder ||
                                  payment.cardName ||
                                  "N/A"}
                              </span>
                              <span className="card-num">
                                {payment.card?.cardNumber || "****"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge-history status-${
                              ["success", "approved", "completed"].includes(
                                status
                              )
                                ? "approved"
                                : ["failed", "rejected"].includes(status)
                                ? "rejected"
                                : "pending"
                            }`}
                          >
                            {payment.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Helper Component */
function StatCard({ icon, label, value, color }) {
  return (
    <div className={`user-stat-card card-${color}`}>
      <div className="stat-header">
        <div className="stat-icon-circle">{icon}</div>
        <TrendingUp className="trend-icon" />
      </div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}
// (Code Bless You, 2025).