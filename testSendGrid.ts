import { inviteEmail } from "./controllers/sendInviteController";

async function test() {
  try {
    await inviteEmail(
      "Lenin", // to_name
      "lenin9073@gmail.com", // to_email
      "LeninMiranda", // from_name
      "lenin9073@gmail.com", // from_email;
      "https://frontend-url.com/invite/123" // tokenUrl
    );
    console.log("✅ Test email sent successfully!");
  } catch (err) {
    console.error("❌ Failed to send test email:", err);
  }
}

test();
