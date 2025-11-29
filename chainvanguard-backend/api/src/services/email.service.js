// api/src/services/email.service.js
import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Get or create transporter (lazy initialization)
   */
  getTransporter() {
    if (!this.transporter) {
      // Remove spaces from app password (Gmail app passwords sometimes have spaces)
      const emailPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");

      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: emailPass,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Send OTP verification email
   */
  async sendOTP(email, otp, name = "User") {
    try {
      const transporter = this.getTransporter();
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || "ChainVanguard"} <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "Verify Your Email - ChainVanguard",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                padding: 40px;
                margin: 20px 0;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
              }
              .logo {
                font-size: 24px;
                font-weight: 300;
                letter-spacing: 0.5px;
                color: #000;
              }
              .otp-box {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
              }
              .otp-code {
                font-size: 36px;
                font-weight: 600;
                letter-spacing: 8px;
                color: #000;
                margin: 10px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
                text-align: center;
              }
              .warning {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">ChainVanguard</div>
              </div>

              <h2 style="font-weight: 400; margin-bottom: 20px;">Verify Your Email</h2>

              <p>Hello ${name},</p>

              <p>Thank you for registering with ChainVanguard. To complete your registration, please use the following verification code:</p>

              <div class="otp-box">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280;">Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">This code will expire in 10 minutes</p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. ChainVanguard will never ask for your verification code.
              </div>

              <p>If you didn't request this code, please ignore this email.</p>

              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ChainVanguard. All rights reserved.</p>
                <p>Secure blockchain-based supply chain management</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ OTP email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send OTP email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  /**
   * Send welcome email with wallet details
   */
  async sendWelcomeEmail(userData, walletData) {
    try {
      const transporter = this.getTransporter();
      const {
        name,
        email,
        role,
        walletAddress,
        city,
        state,
        country,
      } = userData;

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || "ChainVanguard"} <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "Welcome to ChainVanguard - Your Wallet Details",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                padding: 40px;
                margin: 20px 0;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
              }
              .logo {
                font-size: 24px;
                font-weight: 300;
                letter-spacing: 0.5px;
                color: #000;
              }
              .details-box {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                padding: 20px;
                margin: 20px 0;
              }
              .detail-row {
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .detail-row:last-child {
                border-bottom: none;
              }
              .detail-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #6b7280;
                font-weight: 600;
                display: block;
                margin-bottom: 6px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              }
              .detail-value {
                font-size: 14px;
                color: #000;
                word-break: break-all;
                display: block;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              }
              .warning {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                padding: 20px;
                margin: 20px 0;
                font-size: 14px;
              }
              .critical {
                background: #fee2e2;
                border: 1px solid #ef4444;
                padding: 20px;
                margin: 20px 0;
                font-size: 14px;
              }
              .recovery-phrase {
                background: #1f2937;
                color: #fff;
                padding: 20px;
                margin: 20px 0;
                font-family: monospace;
                font-size: 14px;
                word-wrap: break-word;
                border-radius: 4px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
                text-align: center;
              }
              ul {
                margin: 10px 0;
                padding-left: 20px;
              }
              li {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">ChainVanguard</div>
              </div>

              <h2 style="font-weight: 400; margin-bottom: 20px;">Welcome to ChainVanguard!</h2>

              <p>Hello ${name},</p>

              <p>Your account has been successfully created. Below are your wallet details and important security information.</p>

              <div class="details-box">
                <h3 style="margin-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280;">Account Information</h3>

                <div class="detail-row">
                  <div class="detail-label">Name</div>
                  <div class="detail-value">${name}</div>
                </div>

                <div class="detail-row">
                  <div class="detail-label">Email</div>
                  <div class="detail-value">${email}</div>
                </div>

                <div class="detail-row">
                  <div class="detail-label">Role</div>
                  <div class="detail-value">${role.toUpperCase()}</div>
                </div>

                <div class="detail-row">
                  <div class="detail-label">Location</div>
                  <div class="detail-value">${city}, ${state}, ${country}</div>
                </div>
              </div>

              <div class="details-box">
                <h3 style="margin-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280;">Wallet Information</h3>

                <div class="detail-row">
                  <div class="detail-label">Wallet Address</div>
                  <div class="detail-value">${walletAddress}</div>
                </div>

                <div class="detail-row">
                  <div class="detail-label">Wallet Name</div>
                  <div class="detail-value">${walletData.walletName}</div>
                </div>

                <div class="detail-row">
                  <div class="detail-label">Network</div>
                  <div class="detail-value">Hyperledger Fabric</div>
                </div>

                <div class="detail-row">
                  <div class="detail-label">Status</div>
                  <div class="detail-value">Active</div>
                </div>
              </div>

              <div class="critical">
                <h3 style="margin-top: 0; font-size: 14px;">🔐 CRITICAL: Your Recovery Phrase</h3>
                <p style="margin: 10px 0;"><strong>This is the ONLY way to recover your wallet. Store it securely!</strong></p>

                <div class="recovery-phrase">
                  ${walletData.mnemonic}
                </div>

                <h4 style="font-size: 13px; margin: 15px 0 10px 0;">Security Best Practices:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Write this phrase on paper and store it in a safe place</li>
                  <li>Never store it digitally or take screenshots</li>
                  <li>Keep multiple copies in different secure locations</li>
                  <li>Never share your recovery phrase with anyone</li>
                  <li>ChainVanguard will NEVER ask for your recovery phrase</li>
                </ul>
              </div>

              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Anyone with your recovery phrase can access your wallet</li>
                  <li>Lost recovery phrases cannot be recovered</li>
                  <li>Keep your password and recovery phrase separate</li>
                  <li>Be cautious of phishing attempts</li>
                </ul>
              </div>

              <p>You can now login to your account and start using ChainVanguard's blockchain-based supply chain management platform.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login"
                   style="display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 11px;">
                  Login to Dashboard
                </a>
              </div>

              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ChainVanguard. All rights reserved.</p>
                <p>Secure blockchain-based supply chain management</p>
                <p style="margin-top: 10px;">
                  Need help? Contact us at <a href="mailto:${process.env.EMAIL_FROM}" style="color: #000;">${process.env.EMAIL_FROM}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Welcome email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error);
      throw new Error("Failed to send welcome email");
    }
  }

  /**
   * Verify email service connection
   */
  async verifyConnection() {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      console.log("✅ Email service is ready");
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error);
      return false;
    }
  }
}

export default new EmailService();
