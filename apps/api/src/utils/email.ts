// Import Nodemailer to send emails using an SMTP server
import nodemailer from 'nodemailer';

// Import environment variables (SMTP credentials, host, port, etc.)
import { env } from '../config/env';

// Import custom logger for tracking application events and errors
import { logger } from '../config/logger';

// Create a reusable SMTP transporter.
// This transporter maintains the configuration required to communicate
// with the mail server and is reused for every email instead of creating
// a new connection each time.
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  }
});

/**
 * Sends a password reset email to the user.
 *
 * @param to - Recipient's email address
 * @param resetToken - Secure token used to verify the password reset request
 */
export const sendPasswordResetEmail = async (
  to: string,
  otp: string
) => {

  // Configure the email metadata and HTML content.
  const mailOptions = {
    // Sender information displayed in the recipient's inbox
    // If Using Brevo Sender Email should be same as registered Brevo email
    from: `"NexusHub Support" <${env.SMTP_SENDER}>`,

    // Recipient email address
    to,

    // Email subject
    subject: 'Password Reset Request',

    // HTML body shown in the email client
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>Your one-time password reset code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 5px; color: #333; background: #f4f4f5; padding: 10px; text-align: center; border-radius: 5px;">
                ${otp}
              </h1>
              <p>This code will expire in 15 minutes. Do not share this code with anyone.</p>
            </div>
          `,
  };

  try {
    // Send the email using the configured SMTP transporter
    await transporter.sendMail(mailOptions);

    // Log successful email delivery for monitoring and debugging
    logger.info(`Password reset email sent to ${to}`);
  } catch (error) {
    // Log the original SMTP error for developers
    logger.error(`Failed to send email: ${error}`);

    // Throw a generic error so internal SMTP details are not exposed
    throw new Error('Email could not be sent');
  }
};