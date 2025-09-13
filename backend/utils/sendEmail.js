// filepath: backend/utils/sendEmail.js
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, body) {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL, // must be a verified sender in SendGrid
      subject,
      text: body,
      html: `<p>${body}</p>`,
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${to} | Subject: "${subject}"`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}`, err);
    return { success: false, error: err.message };
  }
}

module.exports = sendEmail;
