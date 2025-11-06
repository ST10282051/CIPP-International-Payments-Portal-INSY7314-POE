import amqp from "amqplib";
import tls from "tls";
import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import Employee from "../models/employee.model.js";
import { formatSwiftMessage } from "../services/swiftFormatter.js";

dotenv.config();
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/**
 * Establish a secure TLS connection to SWIFT gateway
 */
function createSwiftConnection() {
  const options = {
    host: process.env.SWIFT_HOST || "swift-simulator.falcone.local",
    port: parseInt(process.env.SWIFT_PORT || "443", 10),
    key: fs.readFileSync(process.env.SWIFT_CLIENT_KEY || "swift-client.key"),
    cert: fs.readFileSync(process.env.SWIFT_CLIENT_CERT || "swift-client.crt"),
    ca: [fs.readFileSync(process.env.SWIFT_CA_CERT || "swift-ca.crt")],
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  };

  const socket = tls.connect(options, () => {
    console.log("✅ Connected securely to SWIFT gateway");
  });

  socket.on("error", (err) => {
    console.error("❌ SWIFT connection error:", err.message);
  });

  return socket;
}

/**
 * Notify SWIFT webhook to simulate confirmation
 */
async function notifySwiftWebhook(swiftReference, status = "confirmed", error = null) {
  try {
    const webhookUrl = process.env.SWIFT_WEBHOOK_URL || "http://localhost:5000/api/swift/webhook";
    await axios.post(webhookUrl, { swiftReference, status, error });
    console.log(`🔔 SWIFT webhook notified for reference ${swiftReference}`);
  } catch (err) {
    console.error("❌ Failed to notify SWIFT webhook:", err.message);
  }
}

/**
 * Process a single payment message from RabbitMQ
 */
async function processSwiftMessage(ch, msg, swiftSocket) {
  try {
    const { paymentId } = JSON.parse(msg.content.toString());
    const payment = await Payment.findById(paymentId)
      .populate("fromUser", "name surname username email")
      .populate("reviewedBy", "username");

    if (!payment || payment.status !== "approved") {
      console.warn(`⚠️ Payment ${paymentId} not ready or missing`);
      ch.ack(msg);
      return;
    }

    const swiftMsg = formatSwiftMessage(payment, payment.fromUser || {}, payment.reviewedBy || {});

    // Send to SWIFT over TLS
    swiftSocket.write(swiftMsg + "\n");

    // Generate a simulated SWIFT reference
    const swiftReference = `SWIFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Update payment as sent
    payment.status = "sent";
    payment.swiftReference = swiftReference;
    payment.swiftSentAt = new Date();
    await payment.save();

    console.log(`✅ Payment ${paymentId} sent to SWIFT (ref: ${swiftReference})`);

    // Automatically notify webhook for testing
    await notifySwiftWebhook(swiftReference, "confirmed");

    ch.ack(msg);
  } catch (err) {
    console.error("❌ Error processing SWIFT message:", err);
    ch.nack(msg, false, false); // discard malformed messages
  }
}

/**
 * Start the SWIFT worker
 */
async function startSwiftWorker() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");
  const ch = await conn.createChannel();
  await ch.assertQueue("swiftQueue", { durable: true });

  const swiftSocket = createSwiftConnection();

  console.log("🚀 SWIFT worker listening for payments...");
  ch.consume("swiftQueue", (msg) => processSwiftMessage(ch, msg, swiftSocket), {
    noAck: false,
  });
}

startSwiftWorker().catch((err) => {
  console.error("Worker startup failed:", err);
  process.exit(1);
});
// (SwiftOnServer, 2024).