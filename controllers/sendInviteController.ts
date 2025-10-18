import nodemailer from "nodemailer";

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
}
