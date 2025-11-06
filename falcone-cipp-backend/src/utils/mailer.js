import { sendEmail } from "../utils/mailer.js";

await sendEmail(
  user.email,
  "Payment Confirmation",
  `<p>Dear ${user.name}, your payment has been received.</p>`
);
