import sgMail from "@sendgrid/mail";

// sgMail.setApiKey configures the SendGrid client so that future calls (like sgMail.send()) include the API key for authentication
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function sendInvitationEmail({
  toEmail,
  toName,
  fromName,
  fromEmail,
  invitationUrl,
}: {
  toEmail: string;
  toName: string;
  fromName: string;
  fromEmail: string;
  invitationUrl: string;
}) {
  const msg = {
    to: toEmail,
    from: {
      name: fromName,
      email: fromEmail,
    },
    subject: `Externship Opportunity Follow-Up - ${toName}`,
    text: `Dear ${toName},
    \n\nI hope this message finds you well. I wanted to reach out regarding your externship application.
    \n\nWe've reviewed your profile and would like to discuss the next-steps in the process. Please follow the link below to accept the invitation:
    \n\n${invitationUrl}
    \n\nBest regards,
    \n${fromName}
    \nTripleTen Externship Team
`,
  };

  await sgMail.send(msg);
}

