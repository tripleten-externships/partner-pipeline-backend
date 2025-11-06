/* import nodemailer from "nodemailer";

export async function inviteEmail(
  to_name: string,
  to_email: string,
  from_name: string,
  from_email: string,
  tokenUrl: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // true for 465
    auth: {
      user: process.env.SMTP_USER || "your_email@example.com",
      pass: process.env.SMTP_PASS || "your_email_password",
    },
  });

  const subject = "You're Invited!";
  const text = `Hello ${to_name},\n\nYou have been invited to participate in the Software Engineering externship.\nPlease follow the link below to accept the invitation:\n${tokenUrl}\n\nBest,\n${from_name}`;

  await transporter.sendMail({
    from: `${from_name} <${from_email}>`,
    to: to_email,
    subject,
    text,
  });
}*/

import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function inviteEmail(
  to_name: string,
  to_email: string,
  from_name: string,
  from_email: string,
  tokenUrl: string
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not defined in environment variables");
  }

  const subject = "You're Invited!";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; padding: 20px;">
      <h2>Hello ${to_name},</h2>
      <p>You have been invited to participate in the <strong>Software Engineering Externship</strong>.</p>
      <p>Please click the link below to accept your invitation:</p>
      <a href="${tokenUrl}" 
         style="display:inline-block; padding:10px 15px; color:white; background:#007BFF; border-radius:5px; text-decoration:none;"
         target="_blank">
         Accept Invitation
      </a>
      <br/><br/>
      <p>Best,<br/>${from_name}</p>
    </div>
  `;
  const msg = {
    to: to_email,
    from: {
      name: from_name,
      email: from_email || process.env.EMAIL_FROM || "no-reply@example.com",
    },
    subject: subject,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Invitation email sent to ${to_email}`);
  } catch (error: any) {
    console.error(`Error sending invitation email to ${to_email}:`, error);
    if (error.response) {
      console.error("SendGrid response error:", error.response.body);
    }
    throw new Error("Failed to send invitation email");
  }
}
