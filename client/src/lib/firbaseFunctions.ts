const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
const db = admin.firestore();

sgMail.setApiKey(
  "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"
); // 🟡 replace this

exports.sendInvitation = functions.https.onCall(async (data, context) => {
  const { to, subject, text } = data;

  const msg = {
    to,
    from: "baqar.falconit@gmail.com", // ✅ Verified sender on SendGrid
    subject,
    text,
  };

  try {
    await sgMail.send(msg);
    await db.collection("invitations").add({
      to,
      subject,
      text,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError("internal", "Failed to send email");
  }
});
