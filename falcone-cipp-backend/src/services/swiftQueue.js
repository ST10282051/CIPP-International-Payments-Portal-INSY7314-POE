import amqp from "amqplib";
import fs from "fs";

/**
 * Send a payment ID to the SWIFT processing queue
 */
export async function sendToSwiftQueue(paymentId) {
  const url = process.env.RABBITMQ_URL || "amqp://localhost";
  const queueName = "swiftQueue";
  let conn;
  try {
    conn = await amqp.connect(url, {
      // optional TLS settings for production:
      cert: fs.existsSync("client-cert.pem") ? fs.readFileSync("client-cert.pem") : undefined,
      key: fs.existsSync("client-key.pem") ? fs.readFileSync("client-key.pem") : undefined,
      ca: fs.existsSync("ca-cert.pem") ? [fs.readFileSync("ca-cert.pem")] : undefined,
    });
    const channel = await conn.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    const payload = { paymentId, createdAt: new Date() };
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
    await channel.close();
    await conn.close();
    console.log(`✅ Queued payment ${paymentId} for SWIFT processing`);
  } catch (err) {
    console.error("❌ Failed to send payment to SWIFT queue:", err);
    if (conn) await conn.close().catch(() => {});
  }
}
// (SwiftOnServer, 2024).