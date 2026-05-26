const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const nodemailer = require('nodemailer');

// Extract and thoroughly sanitize SMTP environment settings to clear any trailing whitespaces/returns
const getSMTPOptions = () => {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt((process.env.SMTP_PORT || '465').toString().trim());
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
  return { host, port, user, pass };
};

// Reusable SMTP transporter constructor
const createTransporter = () => {
  const { host, port, user, pass } = getSMTPOptions();

  // If using Gmail SMTP, utilize Nodemailer's built-in 'gmail' service config preset
  // to avoid SSL handshake or cipher mismatches.
  if (host === 'smtp.gmail.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL secure channel if 465
    auth: { user, pass }
  });
};

// POST submit feedback
router.post('/', async (req, res) => {
  const { name, email, type, message } = req.body;

  // Simple validation
  if (!name || !email || !type || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const newFeedback = new Feedback({
      name,
      email,
      type,
      message
    });

    const savedFeedback = await newFeedback.save();

    // Log feedback receipt on the server console
    console.log('\n==================================================');
    console.log('📬 NEW FEEDBACK RECEIVED & LOGGED TO DB');
    console.log(`Sender: ${name} <${email}>`);
    console.log(`Type: ${type.toUpperCase()}`);
    console.log(`Message: "${message}"`);
    console.log('==================================================\n');

    const { user, pass } = getSMTPOptions();

    // Attempt real-time email dispatch if credentials are provided in .env
    if (user && pass) {
      try {
        const transporter = createTransporter();
        const mailOptions = {
          from: `"${name} (MarkFlow Feedback)" <${user}>`,
          to: 'phaniswarjanyavula@gmail.com',
          replyTo: email,
          subject: `📬 MarkFlow Feedback: ${type.toUpperCase().replace('_', ' ')}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #4f46e5; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">New Feedback Received! 📬</h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px; font-weight: bold; width: 120px; border: 1px solid #e2e8f0;">Name:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Email:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Category:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; text-transform: uppercase;">${type.replace('_', ' ')}</td>
                </tr>
              </table>
              <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #475569; margin-bottom: 5px;">Message Details:</p>
                <p style="margin: 0; font-style: italic; white-space: pre-wrap; color: #1e293b; line-height: 1.5;">"${message}"</p>
              </div>
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
                Sent automatically by the MarkFlow feedback sync service at ${new Date().toLocaleString()}
              </p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Feedback email successfully delivered in real-time to phaniswarjanyavula@gmail.com!`);
      } catch (mailErr) {
        console.error('❌ Failed to dispatch feedback email via SMTP:', mailErr.message);
      }
    } else {
      console.log('⚠️ Real-time email NOT dispatched: SMTP credentials (SMTP_USER/SMTP_PASS) not configured in server/.env file.');
    }

    res.status(201).json({
      status: 'success',
      message: 'Thanks for helping improve MarkFlow.',
      data: savedFeedback
    });
  } catch (err) {
    res.status(500).json({ message: 'Error processing feedback submission', error: err.message });
  }
});

module.exports = router;

