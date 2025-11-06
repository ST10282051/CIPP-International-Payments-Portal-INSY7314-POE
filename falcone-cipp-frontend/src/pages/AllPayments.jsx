import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { 
  CreditCard, 
  User, 
  Calendar, 
  DollarSign, 
  Check, 
  X, 
  Eye,
  Search,
  Filter,
  AlertCircle 
} from "lucide-react";
import { getPayments, approveOrRejectPayment } from "../api/employeeAxios";
import "./AllPayments.css";

const AllPayments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  // Fetch all payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments();
      const data = res.data || [];
      setPayments(data);
      setFilteredPayments(data);
    } catch (err) {
      console.error("Failed to fetch payments:", err.response?.data || err.message);
      alert("Error fetching payments. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter payments based on search and status
  useEffect(() => {
    let filtered = [...payments];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filter by search term (username, email, toAccount)
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.fromUser?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.fromUser?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.toAccount?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, payments]);

  // Handle approve/reject decision
  const handleDecision = async (paymentId, decision) => {
    try {
      await approveOrRejectPayment(paymentId, decision);
      setPayments((prev) =>
        prev.map((p) => (p._id === paymentId ? { ...p, status: decision } : p))
      );
      alert(`Payment ${decision} successfully!`);
    } catch (err) {
      console.error("Failed to update payment:", err.response?.data || err.message);
      alert("Failed to update payment status");
    }
  };

  // Navigate to user payment history
  const handleViewUserPayments = (userId, username) => {
    navigate(`/employee/user-payments/${userId}`, { state: { username } });
  };

  // Get statistics
  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="all-payments-wrapper">
      <Navbar />
      <div className="all-payments-container">
        {/* Header */}
        <div className="payments-header">
          <div className="header-content">
            <h1 className="page-title">All Payments</h1>
            <p className="page-subtitle">Manage and review all payment transactions</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="payments-stats-grid">
          <div className="stat-box stat-total">
            <div className="stat-icon-wrapper">
              <CreditCard className="stat-icon" />
            </div>
            <div className="stat-details">
              <p className="stat-label">Total Payments</p>
              <p className="stat-value">{stats.total}</p>
            </div>
          </div>
          <div className="stat-box stat-pending">
            <div className="stat-icon-wrapper">
              <AlertCircle className="stat-icon" />
            </div>
            <div className="stat-details">
              <p className="stat-label">Pending</p>
              <p className="stat-value">{stats.pending}</p>
            </div>
          </div>
          <div className="stat-box stat-approved">
            <div className="stat-icon-wrapper">
              <Check className="stat-icon" />
            </div>
            <div className="stat-details">
              <p className="stat-label">Approved</p>
              <p className="stat-value">{stats.approved}</p>
            </div>
          </div>
          <div className="stat-box stat-rejected">
            <div className="stat-icon-wrapper">
              <X className="stat-icon" />
            </div>
            <div className="stat-details">
              <p className="stat-label">Rejected</p>
              <p className="stat-value">{stats.rejected}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="payments-filters">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by username, email, or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <Filter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Payments List */}
        <div className="payments-section">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="empty-state">
              <AlertCircle className="empty-icon" />
              <h3 className="empty-title">No payments found</h3>
              <p className="empty-description">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Payment transactions will appear here"}
              </p>
            </div>
          ) : (
            <div className="payments-table-wrapper">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Date</th>
                    <th>To Account</th>
                    <th>Amount</th>
                    <th>Card</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="payment-row">
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">
                            {(payment.fromUser?.username || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <p className="user-name">{payment.fromUser?.username || "Unknown"}</p>
                            <p className="user-email">{payment.fromUser?.email || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar className="date-icon" />
                          <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                          <span className="date-time">
                            {new Date(payment.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="account-number">{payment.toAccount}</span>
                      </td>
                      <td>
                        <div className="amount-cell">
                          <DollarSign className="currency-icon" />
                          <span className="currency-code">{payment.currency}</span>
                          <span className="amount-value">{payment.amount.toFixed(2)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="card-cell">
                          <CreditCard className="card-icon" />
                          <span>{payment.card?.cardHolder || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${payment.status}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          {payment.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleDecision(payment._id, "approved")}
                                className="btn-action btn-approve"
                                title="Approve Payment"
                              >
                                <Check className="btn-icon" />
                              </button>
                              <button
                                onClick={() => handleDecision(payment._id, "rejected")}
                                className="btn-action btn-reject"
                                title="Reject Payment"
                              >
                                <X className="btn-icon" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              handleViewUserPayments(
                                payment.fromUser?._id,
                                payment.fromUser?.username
                              )
                            }
                            className="btn-action btn-view"
                            title="View All Payments by User"
                          >
                            <Eye className="btn-icon" />
                          </button>
                        </div>
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

export default AllPayments;
// (Code Bless You , 2025). 