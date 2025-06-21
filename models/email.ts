import nodemailer from "nodemailer";

export const sendUserUpdateEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"TripleTen Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
