import React, { useState, useEffect } from "react";
import { CreditCard, Calendar, CheckCircle, Clock, XCircle, DollarSign, AlertCircle, TrendingUp } from "lucide-react";
import { getCards, getPayments } from "../api/axios";

function PaymentHistory({ onNavigateToPayment }) {
  const [payments, setPayments] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, cardsRes] = await Promise.all([getPayments(), getCards()]);
      const fetchedPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      fetchedPayments.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setPayments(fetchedPayments);
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
    } catch (err) {
      console.error("Failed to fetch payment data:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    pending: payments.filter(p => p.status?.toLowerCase() === "pending").length,
    success: payments.filter(p => ["success", "approved", "completed", "confirmed"].includes(p.status?.toLowerCase())).length,
    failed: payments.filter(p => ["failed", "rejected"].includes(p.status?.toLowerCase())).length,
  };

  const getStatusIcon = status => {
    const s = status?.toLowerCase();
    if (["confirmed", "completed", "success", "approved"].includes(s)) return <CheckCircle className="text-green-400" size={20} />;
    if (["failed", "rejected"].includes(s)) return <XCircle className="text-red-400" size={20} />;
    return <Clock className="text-yellow-400" size={20} />;
  };

  const getStatusClass = status => {
    const s = status?.toLowerCase();
    if (["confirmed", "completed", "success", "approved"].includes(s)) return "status-approved";
    if (["failed", "rejected"].includes(s)) return "status-rejected";
    return "status-pending";
  };

  const filteredPayments = payments.filter(p => {
    if (filter === "all") return true;
    const s = p.status?.toLowerCase();
    if (filter === "completed") return ["success", "approved", "completed", "confirmed"].includes(s);
    return s === filter;
  });

  if (loading) {
    return (
      <div className="payment-history-loading">
        <div className="loading-spinner-large"></div>
        <p className="loading-text">Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="user-payments-wrapper">
      <div className="user-payments-container">
        {/* Stats */}
        <div className="user-stats-grid">
          <StatCard icon={<CreditCard />} label="Total Transactions" value={stats.total} color="purple" />
          <StatCard icon={<DollarSign />} label="Total Amount" value={`R ${stats.totalAmount.toFixed(2)}`} color="green" />
          <StatCard icon={<CheckCircle />} label="Successful" value={stats.success} color="blue" />
          <StatCard icon={<Clock />} label="Pending" value={stats.pending} color="orange" />
        </div>

        {/* Filters */}
        <div className="filter-buttons-inline mb-6">
          {["all", "completed", "pending", "failed"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`filter-btn-small ${filter === status ? "filter-btn-small-active" : ""}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Payment Cards as Form-like Fields */}
        {filteredPayments.length === 0 ? (
          <div className="empty-state">
            <AlertCircle className="empty-icon" size={48} />
            <h3 className="empty-title">No payments found</h3>
            <p className="empty-description">You have no payments matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((p, idx) => {
              const date = new Date(p.createdAt || p.date);
              return (
                <div key={p._id || idx} className="card-item">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(p.status)}
                      <span className={`usage-badge ${getStatusClass(p.status)}`}>{p.status || "Pending"}</span>
                    </div>
                    <div className="text-sm text-gray-500">{date.toLocaleDateString()} {date.toLocaleTimeString()}</div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-gray-400 text-xs font-semibold">Recipient Account</label>
                      <input
                        type="text"
                        value={p.toAccount || "N/A"}
                        readOnly
                        className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-700"
                      />
                    </div>
                    {p.card && (
                      <div>
                        <label className="block text-gray-400 text-xs font-semibold">Card Info</label>
                        <input
                          type="text"
                          value={`${p.card.cardHolder} •••• ${p.card.cardNumber?.slice(-4)}`}
                          readOnly
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-700"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-gray-400 text-xs font-semibold">Amount</label>
                      <input
                        type="text"
                        value={`${p.currency || "ZAR"} ${parseFloat(p.amount || 0).toFixed(2)}`}
                        readOnly
                        className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-700"
                      />
                    </div>
                    {p._id && (
                      <div>
                        <label className="block text-gray-400 text-xs font-semibold">Payment ID</label>
                        <input
                          type="text"
                          value={p._id}
                          readOnly
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-500 text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`user-stat-card card-${color}`}>
      <div className="stat-header">
        <div className="stat-icon-circle">{icon}</div>
        <TrendingUp className="trend-icon" />
      </div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

export default PaymentHistory;
// (Code Bless You , 2025). 