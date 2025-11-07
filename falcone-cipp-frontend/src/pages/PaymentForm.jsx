import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard } from "lucide-react";
import { getCards, addCard, createPayment } from "../api/axios";
import "./PaymentForm.css";

function PaymentForm({ prefillCard = null, onBack, onAddTransaction, onUpdateCards, refreshPayments }) {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(prefillCard?._id || "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardHolder: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const [formData, setFormData] = useState({
    toAccount: "",
    currency: "ZAR",
    amount: "",
    swiftCode: "" // for UX only, not sent to backend
  });

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await getCards();
      const fetchedCards = response.data || [];
      setCards(fetchedCards);

      if (prefillCard && fetchedCards.some(c => c._id === prefillCard._id)) {
        setSelectedCardId(prefillCard._id);
      } else if (fetchedCards.length > 0) {
        setSelectedCardId(fetchedCards[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();

    if (!newCard.cardHolder || !newCard.cardNumber || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv) {
      alert("Please fill in all card fields");
      return;
    }

    const payload = {
      ...newCard,
      expiryMonth: parseInt(newCard.expiryMonth, 10),
      expiryYear: parseInt(newCard.expiryYear, 10),
      cardNumber: newCard.cardNumber.replace(/\s+/g, ""),
    };

    try {
      const response = await addCard(payload);
      const addedCard = response.data;
      setCards(prev => [...prev, addedCard]);
      setSelectedCardId(addedCard._id);
      setShowAddCard(false);
      setNewCard({ cardHolder: "", cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "" });

      if (onUpdateCards) onUpdateCards([...cards, addedCard]);
    } catch (error) {
      console.error("Failed to add card:", error);
      alert(error.response?.data?.error || "Failed to add card");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCardId || !formData.toAccount || !formData.amount) {
      alert("Please fill all required fields and select a card");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        cardId: selectedCardId,
        toAccount: formData.toAccount,
        amount: parseFloat(formData.amount),
        currency: formData.currency
      };

      const tx = await createPayment(payload);

      alert("Payment submitted successfully!");
      setFormData({ toAccount: "", currency: "ZAR", amount: "", swiftCode: "" });

      if (onAddTransaction) onAddTransaction(tx.data);
      if (refreshPayments) refreshPayments();
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.response?.data?.error || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="payment-page">
      {/* Navigation Buttons */}
      <div className="top-buttons">
        <button className="btn-back" onClick={onBack}>Back</button>
        <button className="btn-history" onClick={() => navigate("/payment-history")}>View History</button>
      </div>

      {/* Card Selection */}
      <div className="card-selection">
        <h2>Payment Method</h2>
        {cards.length === 0 ? (
          <div className="no-cards">
            <CreditCard size={48} />
            <p>No cards available. Please add one.</p>
          </div>
        ) : (
          cards.map(card => (
            <label
              key={card._id}
              className={`card-item ${selectedCardId === card._id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="card"
                value={card._id}
                checked={selectedCardId === card._id}
                onChange={e => setSelectedCardId(e.target.value)}
              />
              {card.cardHolder || "Unknown"} •••• {card.cardNumber?.slice(-4) || "XXXX"} ({card.expiryMonth || "MM"}/{card.expiryYear || "YY"})
            </label>
          ))
        )}
        <button type="button" className="btn-add-card" onClick={() => setShowAddCard(true)}>
          Add New Card
        </button>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="modal-overlay">
          <form onSubmit={handleAddCard} className="modal-form">
            <h2>Add New Card</h2>
            <input type="text" placeholder="Card Holder Name" value={newCard.cardHolder} onChange={e => setNewCard({ ...newCard, cardHolder: e.target.value })} />
            <input type="text" placeholder="Card Number" value={newCard.cardNumber} onChange={e => setNewCard({ ...newCard, cardNumber: e.target.value })} />
            <div className="grid">
              <input type="text" placeholder="MM" value={newCard.expiryMonth} onChange={e => setNewCard({ ...newCard, expiryMonth: e.target.value })} />
              <input type="text" placeholder="YY" value={newCard.expiryYear} onChange={e => setNewCard({ ...newCard, expiryYear: e.target.value })} />
              <input type="text" placeholder="CVV" value={newCard.cvv} onChange={e => setNewCard({ ...newCard, cvv: e.target.value })} />
            </div>
            <div className="modal-buttons">
              <button type="button" className="btn-cancel" onClick={() => setShowAddCard(false)}>Cancel</button>
              <button type="submit" className="btn-save">Save Card</button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Details */}
      <div className="payment-details">
        <h2>Transfer Details</h2>
        <input type="text" placeholder="Recipient Account / IBAN" value={formData.toAccount} onChange={e => setFormData({ ...formData, toAccount: e.target.value })} />
        <input type="text" placeholder="SWIFT Code (Optional)" value={formData.swiftCode} onChange={e => setFormData({ ...formData, swiftCode: e.target.value })} />
        <div className="grid-cols-2">
          <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
            <option value="ZAR">ZAR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          <input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
        </div>
        <button className="btn-submit" onClick={handleSubmit} disabled={submitting || cards.length === 0}>
          {submitting ? "Processing..." : "Complete Payment"}
        </button>
      </div>
    </div>
  );
}

export default PaymentForm;
