import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  DollarSign,
  Search,
  Eye,
  Trash2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { getAllUsers, deleteUser } from "../api/employeeAxios";
import "./AllUsers.css";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      const data = res.data || [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err.response?.data || err.message);
      alert("Error fetching users. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.surname?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // Handle delete user
  const handleDeleteUser = async (userId, username) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
      alert(`User "${username}" deleted successfully!`);
    } catch (err) {
      console.error("Failed to delete user:", err.response?.data || err.message);
      alert(
        err.response?.data?.error ||
          "Failed to delete user. They may have existing payments."
      );
    }
  };

  // Navigate to user details
  const handleViewDetails = (userId) => {
    navigate(`/employee/user-details/${userId}`);
  };

  // Statistics
  const stats = {
    total: users.length,
    withPayments: users.filter((u) => u.paymentCount > 0).length,
    withCards: users.filter((u) => u.cardCount > 0).length,
  };

  return (
    <div className="all-users-wrapper">
      <Navbar />
      <div className="all-users-container">
        {/* Header */}
        <div className="users-header">
          <button onClick={() => navigate(-1)} className="btn-back-users">
            <ArrowLeft className="back-icon" />
            Back
          </button>
          <div className="header-title">
            <h1 className="page-title-users">All Users</h1>
            <p className="page-subtitle-users">
              Manage customer accounts and view their activity
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="users-stats-grid">
          <div className="stat-box-users stat-total-users">
            <div className="stat-icon-wrapper-users">
              <User className="stat-icon-users" />
            </div>
            <div className="stat-details-users">
              <p className="stat-label-users">Total Users</p>
              <p className="stat-value-users">{stats.total}</p>
            </div>
          </div>
          <div className="stat-box-users stat-active-users">
            <div className="stat-icon-wrapper-users">
              <DollarSign className="stat-icon-users" />
            </div>
            <div className="stat-details-users">
              <p className="stat-label-users">With Payments</p>
              <p className="stat-value-users">{stats.withPayments}</p>
            </div>
          </div>
          <div className="stat-box-users stat-cards-users">
            <div className="stat-icon-wrapper-users">
              <CreditCard className="stat-icon-users" />
            </div>
            <div className="stat-details-users">
              <p className="stat-label-users">With Cards</p>
              <p className="stat-value-users">{stats.withCards}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="search-section-users">
          <div className="search-box-users">
            <Search className="search-icon-users" />
            <input
              type="text"
              placeholder="Search by username, email, name, or surname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-users"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="users-section">
          {loading ? (
            <div className="loading-state-users">
              <div className="loading-spinner-users"></div>
              <p className="loading-text-users">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state-users">
              <AlertCircle className="empty-icon-users" />
              <h3 className="empty-title-users">No users found</h3>
              <p className="empty-description-users">
                {searchTerm
                  ? "Try adjusting your search"
                  : "No users in the system yet"}
              </p>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map((user) => (
                <div key={user._id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-avatar-card">
                      {(user.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info-card">
                      <h3 className="user-name-card">
                        {user.name} {user.surname}
                      </h3>
                      <p className="user-username-card">@{user.username}</p>
                    </div>
                  </div>

                  <div className="user-card-body">
                    <div className="user-detail-row">
                      <Mail className="detail-icon" />
                      <span className="detail-text">{user.email}</span>
                    </div>
                    <div className="user-detail-row">
                      <Phone className="detail-icon" />
                      <span className="detail-text">
                        {user.cellNumber || user.phone || "N/A"}
                      </span>
                    </div>
                    <div className="user-detail-row">
                      <CreditCard className="detail-icon" />
                      <span className="detail-text">
                        {user.cardCount || 0} card(s)
                      </span>
                    </div>
                    <div className="user-detail-row">
                      <DollarSign className="detail-icon" />
                      <span className="detail-text">
                        {user.paymentCount || 0} payment(s)
                      </span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <button
                      onClick={() => handleViewDetails(user._id)}
                      className="btn-view-details"
                      title="View Details"
                    >
                      <Eye className="btn-icon-card" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id, user.username)}
                      className="btn-delete-user"
                      title="Delete User"
                    >
                      <Trash2 className="btn-icon-card" />
                      Delete
                    </button>
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

export default AllUsers;
// (Code Bless You , 2025). 