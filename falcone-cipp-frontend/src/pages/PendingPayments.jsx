// src/pages/PendingPayments.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { AlertCircle, Check, X } from "lucide-react";
import { getPayments, approveOrRejectPayment } from "../api/employeeAxios"; // ✅ employee/admin API
import './PendingPayments.css'; // optional styling

const PendingPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch only pending payments
  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments(); // employee/admin API
      const pending = (res.data || []).filter((p) => p.status === "pending");
      setPayments(pending);
    } catch (err) {
      console.error("Failed to fetch payments:", err.response?.data || err.message);
      alert("Error fetching pending payments. Check your login or API access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();

    // Poll every 10 seconds
    const interval = setInterval(fetchPendingPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (paymentId, decision) => {
    try {
      await approveOrRejectPayment(paymentId, decision);
      setPayments((prev) => prev.filter((p) => p._id !== paymentId));
    } catch (err) {
      console.error("Failed to update payment:", err.response?.data || err.message);
      alert("Failed to update payment status");
    }
  };

  if (loading) return <div className="text-orange-400 text-center mt-12">Loading payments...</div>;

  return (
    <div className="min-h-screen bg-black text-orange-400 p-6">
      <Navbar />
      <div className="max-w-5xl mx-auto mt-6">
        <h1 className="text-3xl font-bold mb-6">Pending Payments Approval</h1>

        {payments.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <p>No pending payments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <div
                key={p._id}
                className="flex justify-between items-center bg-gray-900 p-4 rounded-lg"
              >
                <div>
                  <p className="font-semibold">{p.fromUser?.username || "Unknown User"}</p>
                  <p className="text-sm text-orange-300">{p.currency} {p.amount}</p>
                  <p className="text-xs text-orange-400">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : "No Date"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision(p._id, "approved")}
                    className="flex items-center gap-1 px-3 py-1 bg-green-900 text-green-400 rounded hover:bg-green-800"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleDecision(p._id, "rejected")}
                    className="flex items-center gap-1 px-3 py-1 bg-red-900 text-red-400 rounded hover:bg-red-800"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingPayments;
// (Code Bless You , 2025). 