import sgMail from "@sendgrid/mail";
import { Request, Response } from "express";

export const sendInvitationEmail = async (req: Request, _res: Response, rawToken: string) => {
  const { name, email, roleToGrant } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  const message = {
    to: email,
    from: "hello@tripleten.com",
    subject: "You're invited!",
    html: `
      <p>Hi ${name}, you’ve been invited as a ${roleToGrant}.</p>
      <p><a href="https://____________.com/register?token=${rawToken}">
      Accept your invitation</a></p>
    `,
  };

  // await sgMail.send(message);
  console.log(message);
};
