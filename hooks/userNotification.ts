import { sendUserUpdateEmail } from "../models/email";

export async function sendUserChangeEmail(operation: string, item: any, originalItem: any) {
  try {
    const email = item?.email || originalItem?.email;
    const name = item?.name || originalItem?.name || "User";

    if (!email) return;

    const subject = `Your Account Was ${operation[0].toUpperCase() + operation.slice(1)}`;
    const html = `<p>Hi ${name}, your account was ${operation}d.</p>`;

    await sendUserUpdateEmail(email, subject, html);
  } catch (error) {
    console.error("Failed to send user notification email:", error);
  }
}
