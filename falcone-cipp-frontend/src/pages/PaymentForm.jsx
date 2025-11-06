import React, { useState, useEffect } from "react";

// Simulated API calls - replace with your actual imports
const CustomerAPI = {
  get: async (url) => {
    // Simulate API response
    if (url === "/cards") {
      return { data: [] };
    }
    if (url === "/payments") {
      return { data: [] };
    }
    return { data: null };
  },
  post: async (url, data) => {
    // Simulate API response
    if (url === "/cards") {
      return { data: { card: { _id: Date.now().toString(), ...data } } };
    }
    if (url === "/payments") {
      return { data: { id: Date.now().toString(), status: "Pending" } };
    }
    return { data: null };
  }
};

function PaymentForm({ prefillCard = null, onBack, onAddTransaction, onUpdateCards }) {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState("");
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: ""
  });
  const [toAccount, setToAccount] = useState("");
  const [currency, setCurrency] = useState("ZAR");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await CustomerAPI.get("/cards");
        setCards(res.data || []);
        if (prefillCard) {
          setSelectedCard(prefillCard._id);
        } else if (res.data.length > 0) {
          setSelectedCard(res.data[0]._id);
        } else {
          setShowNewCardForm(true);
        }
        onUpdateCards && onUpdateCards(res.data);
      } catch (err) {
        console.error("Failed to fetch cards:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, [prefillCard]);

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!toAccount || !amount) {
      return alert("Please fill in account and amount");
    }

    try {
      let payload = { toAccount, currency, amount };
      let cardUsed = null;

      if (selectedCard && !showNewCardForm) {
        payload.cardId = selectedCard;
        cardUsed = cards.find(c => c._id === selectedCard);
      } else if (showNewCardForm) {
        if (!newCard.cardNumber || !newCard.cardHolder || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv) {
          return alert("Please fill in all card details");
        }
        const cardRes = await CustomerAPI.post("/cards", newCard);
        payload.cardId = cardRes.data.card._id;
        cardUsed = cardRes.data.card;

        setCards(prev => {
          const updated = [...prev, cardRes.data.card];
          onUpdateCards && onUpdateCards(updated);
          return updated;
        });
      } else {
        return alert("Please select a card or enter new card details");
      }

      const res = await CustomerAPI.post("/payments", payload);

      onAddTransaction && onAddTransaction({
        id: res.data.id,
        cardName: cardUsed?.cardHolder || newCard.cardHolder,
        amount,
        currency,
        status: res.data.status || "Pending",
        date: new Date()
      });

      alert("Payment created successfully!");
      onBack && onBack();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Payment failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="text-orange-400 text-xl">Loading payment form...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-orange-500 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
            <h2 className="text-3xl font-bold text-white">Make a Payment</h2>
            <p className="text-orange-100 mt-2">Securely process your transaction</p>
          </div>

          <form onSubmit={handlePayment} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="block text-orange-400 font-semibold text-sm uppercase tracking-wide">
                To Account Number
              </label>
              <input
                type="text"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                required
                placeholder="Enter recipient account number"
                className="w-full p-3 rounded-lg bg-gray-900 text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-orange-400 font-semibold text-sm uppercase tracking-wide">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-900 text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
                >
                  <option value="ZAR">ZAR (R)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-orange-400 font-semibold text-sm uppercase tracking-wide">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full p-3 rounded-lg bg-gray-900 text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="border-t-2 border-gray-800 pt-6">
              <label className="block text-orange-400 font-semibold text-sm uppercase tracking-wide mb-3">
                Payment Method
              </label>
              
              <div className="space-y-3">
                {cards.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="existing-card"
                      name="card-option"
                      checked={!showNewCardForm}
                      onChange={() => setShowNewCardForm(false)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="existing-card" className="text-white font-medium flex-1">
                      Use saved card
                    </label>
                  </div>
                )}

                {!showNewCardForm && cards.length > 0 && (
                  <select
                    value={selectedCard}
                    onChange={(e) => setSelectedCard(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-900 text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors ml-7"
                  >
                    {cards.map(card => (
                      <option key={card._id} value={card._id}>
                        {card.cardHolder} - •••• •••• •••• {card.cardNumber.slice(-4)}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="new-card"
                    name="card-option"
                    checked={showNewCardForm}
                    onChange={() => setShowNewCardForm(true)}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="new-card" className="text-white font-medium">
                    Add new card
                  </label>
                </div>
              </div>

              {showNewCardForm && (
                <div className="mt-4 space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="space-y-2">
                    <label className="block text-orange-400 text-sm font-semibold">Card Number</label>
                    <input
                      type="text"
                      value={newCard.cardNumber}
                      onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                      placeholder="1234 5678 9012 3456"
                      maxLength="16"
                      className="w-full p-3 rounded-lg bg-black text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-orange-400 text-sm font-semibold">Card Holder Name</label>
                    <input
                      type="text"
                      value={newCard.cardHolder}
                      onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })}
                      placeholder="John Doe"
                      className="w-full p-3 rounded-lg bg-black text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="block text-orange-400 text-sm font-semibold">Month</label>
                      <input
                        type="number"
                        placeholder="MM"
                        value={newCard.expiryMonth}
                        onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value })}
                        min="1"
                        max="12"
                        className="w-full p-3 rounded-lg bg-black text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-orange-400 text-sm font-semibold">Year</label>
                      <input
                        type="number"
                        placeholder="YYYY"
                        value={newCard.expiryYear}
                        onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value })}
                        min="2025"
                        className="w-full p-3 rounded-lg bg-black text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-orange-400 text-sm font-semibold">CVV</label>
                      <input
                        type="text"
                        value={newCard.cvv}
                        onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                        placeholder="123"
                        maxLength="4"
                        className="w-full p-3 rounded-lg bg-black text-white border-2 border-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Complete Payment
              </button>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-orange-400 font-bold py-4 px-6 rounded-lg transition-all border-2 border-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PaymentHistory({ onBack }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await CustomerAPI.get("/payments");
        setPayments(res.data || []);
      } catch (err) {
        console.error("Failed to fetch payments:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return "bg-green-900 text-green-300 border-green-600";
      case "pending":
        return "bg-yellow-900 text-yellow-300 border-yellow-600";
      case "failed":
        return "bg-red-900 text-red-300 border-red-600";
      default:
        return "bg-gray-800 text-gray-300 border-gray-600";
    }
  };

  const filteredPayments = payments.filter(p => {
    if (filter === "all") return true;
    return p.status?.toLowerCase() === filter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="text-orange-400 text-xl">Loading payment history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-orange-500 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-white">Payment History</h2>
                <p className="text-orange-100 mt-2">View all your transactions</p>
              </div>
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-3 mb-6">
              {["all", "completed", "pending", "failed"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filter === status
                      ? "bg-orange-600 text-white"
                      : "bg-gray-800 text-orange-400 hover:bg-gray-700"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {filteredPayments.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-orange-400 text-6xl mb-4">💳</div>
                <h3 className="text-xl text-gray-400 mb-2">No payments found</h3>
                <p className="text-gray-500">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment, idx) => (
                  <div
                    key={payment.id || idx}
                    className="bg-gray-900 border-2 border-gray-800 rounded-xl p-6 hover:border-orange-500 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-bold text-lg">
                            {payment.cardName || payment.cardHolder || "Card Payment"}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(payment.status)}`}>
                            {payment.status || "Pending"}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">
                          To: <span className="text-orange-400 font-mono">{payment.toAccount}</span>
                        </p>
                        <p className="text-gray-500 text-sm">
                          {payment.date ? new Date(payment.date).toLocaleString() : "Date unavailable"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-400">
                          {payment.currency} {parseFloat(payment.amount).toFixed(2)}
                        </div>
                        {payment.id && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            ID: {payment.id.slice(0, 8)}...
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
    </div>
  );
}

// Main App Component 
export default function App() {
  const [view, setView] = useState("payment");

  return (
    <div>
      <div className="bg-gray-900 border-b-2 border-orange-500 p-4">
        <div className="max-w-6xl mx-auto flex gap-4">
          <button
            onClick={() => setView("payment")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              view === "payment"
                ? "bg-orange-600 text-white"
                : "bg-gray-800 text-orange-400 hover:bg-gray-700"
            }`}
          >
            Make Payment
          </button>
          <button
            onClick={() => setView("history")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              view === "history"
                ? "bg-orange-600 text-white"
                : "bg-gray-800 text-orange-400 hover:bg-gray-700"
            }`}
          >
            View Payment History
          </button>
        </div>
      </div>

      {view === "payment" ? (
        <PaymentForm onBack={() => setView("history")} />
      ) : (
        <PaymentHistory onBack={() => setView("payment")} />
      )}
    </div>
  );
}
// (Code Bless You , 2025). 