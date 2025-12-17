import { BaseKeystoneTypeInfo, KeystoneContext,  } from "@keystone-6/core/types";
import { generateInviteToken, hashInviteToken } from "../utils/invites"
import { sendInvitationEmail } from "../utils/sendgrid"

export async function sendInviteController<TypeInfo extends BaseKeystoneTypeInfo>({
  context,
  toEmail,
  toName,
  projectId,
  fromName,
  fromEmail,
}: {
  context: KeystoneContext<TypeInfo>;
  toEmail: string;
  toName: string;
  projectId: string;
  fromName?: string; // make optional so frontend doesn't require it - can set the default here on backend
  fromEmail?: string; // make optional so frontend doesn't require it - can set the default here on backend
}){
    const DEFAULT_FROM_NAME = "Admin Team"; 
    const DEFAULT_FROM_EMAIL = "no-reply@tripleten-internal.com"; // TODO: replace with actual default "from" email address

    const senderName = fromName || DEFAULT_FROM_NAME;
    const senderEmail = fromEmail || DEFAULT_FROM_EMAIL;

    const rawToken = generateInviteToken();

    const tokenHash = hashInviteToken(rawToken);

    // Configure expiration and how many times the token can be used.
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
    const maxUses = 1;

    // Create the InvitationToken record in Keystone (this triggers the afterOperation log hook).
    const createdToken = await context.db.InvitationToken.createOne({
        data: {
            tokenHash,
            expiresAt,
            maxUses,
            project: { connect: { id: projectId } },
            // POTENTIAL FUTURE TODO: EXPAND roleToGrant TO ALSO INCLUDE: ExternalPartner 
            roleToGrant: "Student", // the role the invitee will become if they accept the invitation
            createdBy: { connect: { id: context.session?.data?.id } },
        },
    });

    // The actual invite URL to send (Users receive the *raw* token, not the hash)
    // FUTURE TODO: REPLACE "http://localhost:3000" WITH ${APP_URL} or ${BASE_URL} WHEN READY FOR PRODUCTION 
    const invitationUrl = `http://localhost:3000/invite?token=${rawToken}`;

    // Send email using SendGrid
    await sendInvitationEmail({
    toEmail,
    toName,
    fromName: senderName,
    fromEmail: senderEmail,
    invitationUrl,
  });

  // return the created token record
  return createdToken;

}

// TODO: DELETE CODE BELOW AFTER CODE REVIEW FOR SENDGRID CONTROLLER IS APPROVED (ABOVE^^)
// ----- OLD nodemailer Controller ----- 

// import nodemailer from "nodemailer";

// export async function inviteEmail(
//   to_name: string,
//   to_email: string,
//   from_name: string,
//   from_email: string,
//   tokenUrl: string
// ): Promise<void> {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST || "smtp.example.com",
//     port: Number(process.env.SMTP_PORT || 587),
//     secure: false, // true for 465
//     auth: {
//       user: process.env.SMTP_USER || "your_email@example.com",
//       pass: process.env.SMTP_PASS || "your_email_password",
//     },
//   });

//   const subject = "You're Invited!";
//   const text = `Hello ${to_name},\n\nYou have been invited to participate in the Software Engineering externship.\nPlease follow the link below to accept the invitation:\n${tokenUrl}\n\nBest,\n${from_name}`;

//   await transporter.sendMail({
//     from: `${from_name} <${from_email}>`,
//     to: to_email,
//     subject,
//     text,
//   });
// }
