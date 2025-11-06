import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  CreditCard,
  DollarSign,
  Calendar,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { getUserDetails, deleteUser } from "../api/employeeAxios";
import "./UserDetails.css";

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch user details
  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const res = await getUserDetails(userId);
      setUserDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch user details:", err.response?.data || err.message);
      alert("Error fetching user details.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  // Handle delete user
  const handleDeleteUser = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userDetails.username}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteUser(userId);
      alert(`User "${userDetails.username}" deleted successfully!`);
      navigate("/employee/all-users");
    } catch (err) {
      console.error("Failed to delete user:", err.response?.data || err.message);
      alert(
        err.response?.data?.error ||
          "Failed to delete user. They may have existing payments."
      );
    }
  };

  if (loading) {
    return (
      <div className="user-details-wrapper">
        <Navbar />
        <div className="user-details-container">
          <div className="loading-state-details">
            <div className="loading-spinner-details"></div>
            <p className="loading-text-details">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return (
    <div className="user-details-wrapper">
      <Navbar />
      <div className="user-details-container">
        {/* Header */}
        <div className="details-header">
          <button onClick={() => navigate(-1)} className="btn-back-details">
            <ArrowLeft className="back-icon-details" />
            Back to Users
          </button>
          <div className="header-user-info">
            <div className="user-avatar-large-details">
              {(userDetails.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="header-text-details">
              <h1 className="user-name-details">
                {userDetails.name} {userDetails.surname}
              </h1>
              <p className="user-username-details">@{userDetails.username}</p>
              <p className="user-role-badge">{userDetails.role || "customer"}</p>
            </div>
          </div>
          <button onClick={handleDeleteUser} className="btn-delete-details">
            <Trash2 className="delete-icon" />
            Delete User
          </button>
        </div>

        {/* Statistics */}
        <div className="details-stats-grid">
          <div className="stat-card-details stat-payments">
            <div className="stat-icon-circle-details">
              <DollarSign className="stat-icon-details" />
            </div>
            <div className="stat-body-details">
              <p className="stat-label-details">Total Payments</p>
              <p className="stat-value-details">{userDetails.paymentCount || 0}</p>
            </div>
          </div>
          <div className="stat-card-details stat-cards">
            <div className="stat-icon-circle-details">
              <CreditCard className="stat-icon-details" />
            </div>
            <div className="stat-body-details">
              <p className="stat-label-details">Saved Cards</p>
              <p className="stat-value-details">{userDetails.cardCount || 0}</p>
            </div>
          </div>
          <div className="stat-card-details stat-joined">
            <div className="stat-icon-circle-details">
              <Calendar className="stat-icon-details" />
            </div>
            <div className="stat-body-details">
              <p className="stat-label-details">Member Since</p>
              <p className="stat-value-details">
                {new Date(userDetails.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="info-section">
          <h2 className="section-title-details">Personal Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon-wrapper">
                <User className="info-icon" />
              </div>
              <div className="info-content">
                <p className="info-label">Full Name</p>
                <p className="info-value">
                  {userDetails.name} {userDetails.surname}
                </p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon-wrapper">
                <User className="info-icon" />
              </div>
              <div className="info-content">
                <p className="info-label">Username</p>
                <p className="info-value">{userDetails.username}</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon-wrapper">
                <Mail className="info-icon" />
              </div>
              <div className="info-content">
                <p className="info-label">Email</p>
                <p className="info-value">{userDetails.email}</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon-wrapper">
                <Phone className="info-icon" />
              </div>
              <div className="info-content">
                <p className="info-label">Phone Number</p>
                <p className="info-value">
                  {userDetails.cellNumber || userDetails.phone || "N/A"}
                </p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon-wrapper">
                <FileText className="info-icon" />
              </div>
              <div className="info-content">
                <p className="info-label">ID Number</p>
                <p className="info-value">{userDetails.idNumber || "N/A"}</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon-wrapper">
                <Calendar className="info-icon" />
              </div>
              <div className="info-content">
                <p className="info-label">Account Created</p>
                <p className="info-value">
                  {new Date(userDetails.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        {userDetails.cards && userDetails.cards.length > 0 && (
          <div className="cards-section-details">
            <h2 className="section-title-details">Payment Cards</h2>
            <div className="cards-grid-details">
              {userDetails.cards.map((card) => (
                <div key={card._id} className="card-item-details">
                  <div className="card-icon-wrapper-details">
                    <CreditCard className="card-item-icon-details" />
                  </div>
                  <div className="card-details-content">
                    <p className="card-holder-details">{card.cardHolder}</p>
                    <p className="card-number-details">{card.cardNumber}</p>
                    <p className="card-expiry-details">
                      Expires: {card.expiryMonth}/{card.expiryYear}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Payments Section */}
        {userDetails.payments && userDetails.payments.length > 0 && (
          <div className="payments-section-details">
            <div className="section-header-details">
              <h2 className="section-title-details">Recent Payments</h2>
              <button
                onClick={() =>
                  navigate(`/employee/user-payments/${userId}`, {
                    state: { username: userDetails.username },
                  })
                }
                className="btn-view-all-payments"
              >
                View All Payments
              </button>
            </div>
            <div className="payments-list-details">
              {userDetails.payments.slice(0, 5).map((payment) => (
                <div key={payment._id} className="payment-item-details">
                  <div className="payment-left">
                    <div className="payment-icon-wrapper-details">
                      <DollarSign className="payment-icon-details" />
                    </div>
                    <div className="payment-info-details">
                      <p className="payment-account">To: {payment.toAccount}</p>
                      <p className="payment-date">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="payment-right">
                    <p className="payment-amount-details">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </p>
                    <span className={`payment-status-badge status-${payment.status}`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty States */}
        {(!userDetails.cards || userDetails.cards.length === 0) &&
          (!userDetails.payments || userDetails.payments.length === 0) && (
            <div className="empty-state-full">
              <AlertCircle className="empty-icon-full" />
              <h3 className="empty-title-full">No Activity Yet</h3>
              <p className="empty-description-full">
                This user hasn't added any cards or made any payments yet.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default UserDetails;
// (Code Bless You , 2025). 