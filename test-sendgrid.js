import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testSend() {
  const msg = {
    to: "", // ← add a test email here
    from: {
      email: "no-reply@tripleten-internal.com", // must be a verified sender in SendGrid
      name: "SendGrid Test",
    },
    subject: "SendGrid test email",
    text: "If you received this, SendGrid is working 🎉",
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");
  } catch (err) {
    console.error("❌ SendGrid error");
    console.error(err.response?.body || err);
  }
}

testSend();
