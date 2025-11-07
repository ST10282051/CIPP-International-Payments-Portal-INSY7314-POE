import React, { useState, useEffect } from "react";
import { CreditCard, ArrowRight, History, Lock, CheckCircle, Clock, XCircle, Calendar, DollarSign, AlertCircle, TrendingUp } from "lucide-react";
import { getCards, getPayments, createPayment } from "../api/axios";

function PaymentForm({ onNavigateToHistory }) {
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    toAccount: "",
    currency: "ZAR",
    amount: "",
    swiftCode: ""
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await getCards();
      const fetchedCards = response.data || [];
      setCards(fetchedCards);
      if (fetchedCards.length > 0) {
        setSelectedCardId(fetchedCards[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCardId) {
      alert("Please select a payment card");
      return;
    }

    if (!formData.toAccount || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        cardId: selectedCardId,
        toAccount: formData.toAccount,
        currency: formData.currency,
        amount: parseFloat(formData.amount),
        swiftCode: formData.swiftCode || undefined
      };

      await createPayment(payload);
      
      alert("Payment submitted successfully!");
      setFormData({ toAccount: "", currency: "ZAR", amount: "", swiftCode: "" });
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-orange-500/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">International Payment</h1>
              <p className="text-gray-400">Secure SWIFT transfer system</p>
            </div>
            <button
              onClick={onNavigateToHistory}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-orange-400 rounded-lg transition-all border border-gray-700"
            >
              <History size={20} />
              View Payment History
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Card Selection Section */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <CreditCard className="text-orange-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Payment Method</h2>
                <p className="text-gray-400 text-sm">Select your card for this transaction</p>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                <CreditCard className="mx-auto text-gray-500 mb-3" size={48} />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Cards Available</h3>
                <p className="text-gray-500 text-sm mb-4">Please add a payment card to continue</p>
                <button
                  type="button"
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Add New Card
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cards.map((card) => (
                  <label
                    key={card._id}
                    className={`block cursor-pointer transition-all ${
                      selectedCardId === card._id
                        ? "ring-2 ring-orange-500"
                        : "hover:border-gray-600"
                    }`}
                  >
                    <div className={`bg-gradient-to-r ${
                      selectedCardId === card._id
                        ? "from-orange-900/40 to-orange-800/40 border-orange-500"
                        : "from-gray-800/50 to-gray-900/50 border-gray-700"
                    } border rounded-xl p-5 transition-all`}>
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="card"
                          value={card._id}
                          checked={selectedCardId === card._id}
                          onChange={(e) => setSelectedCardId(e.target.value)}
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white font-semibold text-lg">
                              {card.cardHolder}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Calendar size={14} />
                              <span>{card.expiryMonth}/{card.expiryYear}</span>
                            </div>
                          </div>
                          <p className="text-gray-400 font-mono">
                            •••• •••• •••• {card.cardNumber?.slice(-4) || "****"}
                          </p>
                        </div>
                        <CreditCard className={selectedCardId === card._id ? "text-orange-400" : "text-gray-600"} size={32} />
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Details Section */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                <DollarSign className="text-orange-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Transfer Details</h2>
                <p className="text-gray-400 text-sm">Enter recipient information</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Recipient Account */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Recipient Account / IBAN
                </label>
                <input
                  type="text"
                  value={formData.toAccount}
                  onChange={(e) => setFormData({...formData, toAccount: e.target.value})}
                  placeholder="Enter account number or IBAN"
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                />
              </div>

              {/* SWIFT Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  SWIFT/BIC Code <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.swiftCode}
                  onChange={(e) => setFormData({...formData, swiftCode: e.target.value})}
                  placeholder="e.g., DEUTDEFF"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                />
              </div>

              {/* Currency and Amount */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                  >
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-orange-900/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lock className="text-orange-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-orange-300 text-sm font-semibold mb-1">Secure Transaction</p>
                <p className="text-orange-200/70 text-xs">
                  Your payment is protected by bank-level encryption and SWIFT secure protocols
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || cards.length === 0}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3 text-lg"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Payment...
              </>
            ) : (
              <>
                Complete Payment
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    } catch (error) {
      console.error("Failed to fetch payment data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      ["success", "approved", "completed", "confirmed"].includes(
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

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    if (["confirmed", "completed", "success", "approved"].includes(statusLower)) {
      return <CheckCircle className="text-green-400" size={20} />;
    }
    if (["failed", "rejected"].includes(statusLower)) {
      return <XCircle className="text-red-400" size={20} />;
    }
    return <Clock className="text-yellow-400" size={20} />;
  };

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    if (["confirmed", "completed", "success", "approved"].includes(statusLower)) {
      return "bg-green-900/30 text-green-300 border-green-500/30";
    }
    if (["failed", "rejected"].includes(statusLower)) {
      return "bg-red-900/30 text-red-300 border-red-500/30";
    }
    return "bg-yellow-900/30 text-yellow-300 border-yellow-500/30";
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    const status = p.status?.toLowerCase();
    if (filter === "completed")
      return ["success", "approved", "completed", "confirmed"].includes(status);
    return status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-orange-500/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Payment History</h1>
              <p className="text-gray-400">Complete overview of your transactions</p>
            </div>
            <button
              onClick={onNavigateToPayment}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all font-semibold"
            >
              Make New Payment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Payment Methods</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueCards.map((card, idx) => (
                <div
                  key={card._id || idx}
                  className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CreditCard className="text-orange-400" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {card.cardHolder || "Unnamed Holder"}
                      </p>
                      <p className="text-gray-400 text-sm font-mono">
                        •••• {card.cardNumber?.slice(-4) || "****"}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Expires: {card.expiryMonth || "??"}/{card.expiryYear || "??"}
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded">
                        {payments.filter((p) => p.card?.cardNumber === card.cardNumber).length} transactions
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {["all", "completed", "pending", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === status
                  ? "bg-orange-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-16 text-center">
            <AlertCircle className="mx-auto text-gray-700 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-300 mb-2">
              {filter === "all" ? "No payment history" : `No ${filter} payments`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === "all"
                ? "Your transactions will appear here."
                : `You don't have any ${filter} payments yet.`}
            </p>
            {filter === "all" && (
              <button
                onClick={onNavigateToPayment}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all font-semibold"
              >
                Make Your First Payment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment, idx) => {
              const date = new Date(payment.createdAt || payment.date);
              const status = payment.status?.toLowerCase() || "pending";

              return (
                <div
                  key={payment._id || payment.id || idx}
                  className="bg-gradient-to-r from-gray-900 to-black border border-gray-800 hover:border-orange-500/50 rounded-xl p-6 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(payment.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusClass(payment.status)}`}>
                          {payment.status || "Pending"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="text-sm">To:</span>
                          <span className="text-white font-mono text-sm">{payment.toAccount || "N/A"}</span>
                        </div>

                        {payment.card && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <CreditCard size={14} />
                            <span className="text-sm">
                              {payment.card.cardHolder || "N/A"} •••• {payment.card.cardNumber?.slice(-4) || "****"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Calendar size={14} />
                          <span>
                            {date.toLocaleDateString("en-ZA")} {date.toLocaleTimeString("en-ZA")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-400 mb-1">
                        {payment.currency || "ZAR"} {parseFloat(payment.amount || 0).toFixed(2)}
                      </div>
                      {payment._id && (
                        <div className="text-xs text-gray-600 font-mono">
                          ID: {payment._id.slice(0, 8)}...
                        </div>
                      )}
                    </div>
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

/* Helper Component */
function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    purple: "from-purple-900/40 to-purple-800/40 border-purple-500/30",
    green: "from-green-900/40 to-green-800/40 border-green-500/30",
    blue: "from-blue-900/40 to-blue-800/40 border-blue-500/30",
    orange: "from-orange-900/40 to-orange-800/40 border-orange-500/30",
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          {React.cloneElement(icon, { size: 20, className: "text-white" })}
        </div>
        <TrendingUp className="text-white/40" size={18} />
      </div>
      <div>
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [view, setView] = useState("payment");

  return (
    <div className="min-h-screen bg-black">
      {view === "payment" ? (
        <PaymentForm onNavigateToHistory={() => setView("history")} />
      ) : (
        <PaymentHistory onNavigateToPayment={() => setView("payment")} />
      )}
    </div>
  );
}
// (Code Bless You, 2025).