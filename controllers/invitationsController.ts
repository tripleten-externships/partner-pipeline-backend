import { Request, Response } from "express";
import { Context } from ".keystone/types";
import nodemailer from "nodemailer";

export const sendInvitationEmail = async (req: Request, res: Response, context: Context) => {
  try {
    const { name, email, role } = req.body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, //smtp.gmail.com for gmail, use whatever tripleten.com uses
      port: Number(process.env.SMTP_PORT),// 587
      auth: {
        user: process.env.SMTP_USER, // hello@tripleten.com
        pass: process.env.SMTP_PASS,  // idk wasn't given
      },
    });

    await transporter.sendMail({
      from: '"My App" <hello@tripleten.com>',
      to: email,
      subject: "You're invited!",
      html: `<p>Hi ${name}, you’ve been invited as a ${role}.</p>`,
    });

    res.status(200).json("Email sent");
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ message: "Error sending email" });
  }
};
