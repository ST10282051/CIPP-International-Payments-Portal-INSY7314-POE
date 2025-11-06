import React, { useState, useEffect } from "react";
import {
  Shield,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Activity,
  LogOut,
  ArrowRightCircle,
  Sparkles,
  User, 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCards, getPayments } from "../api/axios"; // Import the named functions
import './CustomerDashboard.css';
import FalconLogo from "../assets/falconecipplogo.png"; 

const exchangeRates = { ZAR: 1, USD: 0.052, EUR: 0.049, GBP: 0.043 };
const currencySymbols = { ZAR: "R", USD: "$", EUR: "€", GBP: "£" };

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [convertedTransactions, setConvertedTransactions] = useState([]);
  const [currency, setCurrency] = useState("ZAR");
  const [loading, setLoading] = useState(true);

  // Fetch user data, cards, and payments
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");  // Changed from "/login" to "/"
          return;
        }

        // Fetch cards - FIXED: Now uses correct endpoint
        const cardsRes = await getCards();
        setCards(cardsRes.data || []);

        // Fetch payments - FIXED: Now uses correct endpoint
        const paymentsRes = await getPayments();
        const txs = paymentsRes.data || [];
        setTransactions(txs);
        convertTransactions(txs, currency);

        // Set basic user info from first payment or placeholder
        const firstTx = txs[0];
        setUser({
          username: firstTx?.fromUser?.username || "Customer",
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
        localStorage.removeItem("token");
        navigate("/");  // Changed from "/login" to "/"
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // Re-convert transactions when currency changes
  useEffect(() => {
    convertTransactions(transactions, currency);
  }, [currency, transactions]);

  const convertTransactions = (txs, currency) => {
    const rate = exchangeRates[currency];
    const updatedTxs = txs.map((tx) => ({
      ...tx,
      convertedAmount: (parseFloat(tx.amount || 0) * rate).toFixed(2),
    }));
    setConvertedTransactions(updatedTxs);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");  // Changed from "/login" to "/"
  };

  const handleCurrencyChange = (e) => setCurrency(e.target.value);

  const totalSpent = convertedTransactions.reduce(
    (sum, tx) => sum + parseFloat(tx.convertedAmount || 0),
    0
  );
  const savedCardsCount = cards.length;
  const successfulTransactions = convertedTransactions.filter(
    (t) => t.status === "Success"
  ).length;
  const userName = user?.username || "User";

  const recentTransactions = [...convertedTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p className="loading-text-large">Loading dashboard...</p>
      </div>
    );

  if (!user) return null;

  return (
    <div className="customer-dashboard-wrapper">
      <div className="customer-dashboard-container">
        {/* HEADER */}
        <div className="dashboard-header-card">
          <div className="header-content-section">
            <div className="header-icon-wrapper">
              <img src={FalconLogo} alt="Falcone CIPP Logo" className="header-icon" />
            </div>
            <div className="header-text">
              <h1 className="header-title">
                Welcome, <span className="header-name">{userName}</span>
              </h1>
              <p className="header-subtitle">
                Manage your secure payments and transactions
              </p>
            </div>
          </div>

          <div className="header-actions">
            <div className="currency-selector-wrapper">
              <select
                value={currency}
                onChange={handleCurrencyChange}
                className="currency-selector"
              >
                {Object.keys(exchangeRates).map((cur) => (
                  <option key={cur} value={cur}>
                    {cur} ({currencySymbols[cur]})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => navigate("/customer/profile")}
              className="btn btn-profile"
            >
              <User className="btn-icon-sm" />
              Profile
            </button>

            <button onClick={handleLogout} className="btn btn-logout">
              <LogOut className="btn-icon-sm" />
              Logout
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="stats-grid-customer">
          <div className="stat-card-customer stat-card-orange">
            <div className="stat-card-header-customer">
              <div className="stat-icon-container stat-icon-orange">
                <TrendingUp className="stat-icon-customer" />
              </div>
              <h3 className="stat-title-customer">Total Spent</h3>
            </div>
            <div className="stat-content-customer">
              <p className="stat-value-customer stat-value-orange">
                {currencySymbols[currency]}{totalSpent.toFixed(2)}
              </p>
              <p className="stat-subtitle-customer">
                {convertedTransactions.length} transaction(s)
              </p>
            </div>
          </div>

          <div className="stat-card-customer stat-card-green">
            <div className="stat-card-header-customer">
              <div className="stat-icon-container stat-icon-green">
                <Activity className="stat-icon-customer" />
              </div>
              <h3 className="stat-title-customer">Transactions</h3>
            </div>
            <div className="stat-content-customer">
              <p className="stat-value-customer stat-value-green">
                {successfulTransactions}
              </p>
              <p className="stat-subtitle-customer">
                {convertedTransactions.length > 0
                  ? `${(
                      (successfulTransactions / convertedTransactions.length) *
                      100
                    ).toFixed(0)}% success rate`
                  : "No transactions yet"}
              </p>
            </div>
          </div>

          <div className="stat-card-customer stat-card-blue">
            <div className="stat-card-header-customer">
              <div className="stat-icon-container stat-icon-blue">
                <CreditCard className="stat-icon-customer" />
              </div>
              <h3 className="stat-title-customer">Saved Cards</h3>
            </div>
            <div className="stat-content-customer">
              <p className="stat-value-customer stat-value-blue">
                {savedCardsCount}
              </p>
              <p className="stat-subtitle-customer">
                {savedCardsCount > 0 ? "Cards on file" : "No cards saved"}
              </p>
            </div>
          </div>
        </div>

        {/* ACTION CARD */}
        <div
          className="payment-action-card"
          onClick={() =>
            navigate("/payment", {
              state: { prefillCard: cards[savedCardsCount - 1] || null },
            })
          }
        >
          <div className="action-card-content">
            <div className="action-card-text">
              <div className="action-card-badge">
                <Sparkles className="action-badge-icon" />
                <span>Quick Payment</span>
              </div>
              <h2 className="action-card-title">Make a Payment</h2>
              <p className="action-card-description">
                {savedCardsCount > 0
                  ? "Use your saved card for a quick and secure payment"
                  : "Add a new card to start paying securely with us"}
              </p>
              <button className="btn btn-payment-action">
                <CreditCard className="btn-icon" />
                Proceed to Payment
                <ArrowRightCircle className="btn-icon" />
              </button>
            </div>
            <div className="action-card-visual">
              <div className="action-visual-circle"></div>
              <Shield className="action-visual-icon" />
            </div>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="recent-transactions-section">
          <div className="section-header-customer">
            <h2 className="section-title-customer">Recent Activity</h2>
            {recentTransactions.length > 0 && (
              <span className="section-badge-customer">
                Last 5 Transactions
              </span>
            )}
          </div>

          {recentTransactions.length === 0 ? (
            <div className="empty-state-customer">
              <div className="empty-state-icon-wrapper">
                <AlertCircle className="empty-state-icon-customer" />
              </div>
              <h3 className="empty-state-title-customer">No transactions yet</h3>
              <p className="empty-state-description-customer">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="transactions-list-customer">
              {recentTransactions.map((tx, i) => (
                <div key={i} className="transaction-card-customer">
                  <div className="transaction-info-customer">
                    <div className="transaction-icon-wrapper">
                      <CreditCard className="transaction-icon" />
                    </div>
                    <div className="transaction-details">
                      <p className="transaction-holder">
                        {tx.card?.cardHolder || "Unknown Card"}
                      </p>
                      <p className="transaction-date">
                        {tx.date
                          ? new Date(tx.date).toLocaleString("en-GB")
                          : "No Date"}
                      </p>
                    </div>
                  </div>
                  <div className="transaction-amount-section">
                    <p className="transaction-amount">
                      {currencySymbols[currency]}
                      {tx.convertedAmount}
                    </p>
                    <span
                      className={`transaction-status-badge transaction-status-${
                        tx.status === "Success"
                          ? "success"
                          : tx.status === "Pending"
                          ? "pending"
                          : "failed"
                      }`}
                    >
                      {tx.status}
                    </span>
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

export default CustomerDashboard;