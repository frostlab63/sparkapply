const nodemailer = require('nodemailer');
const emailTemplates = require('../templates/emailTemplates');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEnabled = process.env.EMAIL_ENABLED === 'true';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@sparkapply.com';
    this.fromName = process.env.FROM_NAME || 'SparkApply';
    
    if (this.isEnabled) {
      this.initializeTransporter();
    }
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service configuration error:', error);
        } else {
          console.log('✅ Email service ready');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isEnabled = false;
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.isEnabled) {
      console.log('📧 Email service disabled - would send:', { to, subject });
      return { success: true, messageId: 'dev-mode' };
    }

    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendVerificationEmail(email, verificationToken, userName = null) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const html = emailTemplates.emailVerification(verificationUrl, userName);
    
    const text = `
      Welcome to SparkApply!
      
      Thank you for signing up for SparkApply, the AI-powered job discovery platform.
      
      To get started, please verify your email address by visiting this link:
      ${verificationUrl}
      
      This verification link will expire in 24 hours for security reasons.
      
      If you didn't create an account with SparkApply, you can safely ignore this email.
      
      Best regards,
      The SparkApply Team
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Verify Your SparkApply Account',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email, resetToken, userName = null) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const html = emailTemplates.passwordReset(resetUrl, userName);
    
    const text = `
      Reset Your SparkApply Password
      
      We received a request to reset the password for your SparkApply account.
      
      If you made this request, visit this link to reset your password:
      ${resetUrl}
      
      This password reset link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      Best regards,
      The SparkApply Team
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Reset Your SparkApply Password',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email, userName, profileUrl = null) {
    const defaultProfileUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile`;
    const html = emailTemplates.welcome(userName, profileUrl || defaultProfileUrl);
    
    const text = `
      Welcome to SparkApply, ${userName}!
      
      Congratulations! Your email has been verified and your SparkApply account is now active.
      
      Here's what you can do now:
      - Complete your profile for better job matches
      - Start discovering jobs with our swipe interface
      - Let AI create tailored applications for you
      - Track all your applications in one place
      
      Get started: ${profileUrl || defaultProfileUrl}
      
      Best regards,
      The SparkApply Team
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to SparkApply! 🎉',
      html,
      text,
    });
  }

  async sendTwoFactorCode(email, code, userName = null) {
    const html = emailTemplates.twoFactorCode(code, userName);
    
    const text = `
      Your SparkApply Verification Code
      
      Here's your verification code: ${code}
      
      This code will expire in 10 minutes for security reasons.
      
      If you didn't request this code, please contact our support team.
      
      Best regards,
      The SparkApply Team
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Your SparkApply Verification Code',
      html,
      text,
    });
  }

  async sendSecurityAlert(email, alertType, details, userName = null) {
    const html = emailTemplates.securityAlert(alertType, details, userName);
    
    const text = `
      SparkApply Security Alert
      
      We detected ${alertType} on your SparkApply account.
      
      Activity Details: ${details}
      
      If this was you, no action is needed. If you don't recognize this activity, 
      please secure your account immediately.
      
      Best regards,
      The SparkApply Team
    `;

    return await this.sendEmail({
      to: email,
      subject: 'SparkApply Security Alert',
      html,
      text,
    });
  }

  async sendEmailChangeConfirmation(email, newEmail, confirmUrl, userName = null) {
    const html = emailTemplates.emailChangeConfirmation(newEmail, confirmUrl, userName);
    
    const text = `
      Confirm Your Email Change
      
      You requested to change your SparkApply email address to: ${newEmail}
      
      To complete this change, visit: ${confirmUrl}
      
      This confirmation link will expire in 24 hours.
      
      Best regards,
      The SparkApply Team
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Confirm Email Change - SparkApply',
      html,
      text,
    });
  }
}

module.exports = new EmailService();
