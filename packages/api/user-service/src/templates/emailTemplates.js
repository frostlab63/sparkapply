/**
 * Email Templates for SparkApply
 * Professional HTML email templates with responsive design
 */

const getBaseTemplate = (content, title = 'SparkApply') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
        }
        
        .tagline {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .text {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 20px;
            line-height: 1.7;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        
        .button:hover {
            transform: translateY(-2px);
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #6b7280;
            text-decoration: none;
        }
        
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 30px 0;
        }
        
        .highlight-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .code {
            background-color: #f3f4f6;
            padding: 12px 16px;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 18px;
            letter-spacing: 2px;
            text-align: center;
            color: #1f2937;
            border: 2px solid #e5e7eb;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 30px 20px;
            }
            
            .title {
                font-size: 20px;
            }
            
            .button {
                display: block;
                width: 100%;
                padding: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SparkApply</div>
            <div class="tagline">AI-Powered Job Discovery</div>
        </div>
        
        ${content}
        
        <div class="footer">
            <div class="footer-text">
                This email was sent by SparkApply. If you didn't request this, you can safely ignore it.
            </div>
            <div class="social-links">
                <a href="https://sparkapply.com" class="social-link">Website</a>
                <a href="https://sparkapply.com/help" class="social-link">Help Center</a>
                <a href="https://sparkapply.com/contact" class="social-link">Contact</a>
            </div>
            <div class="footer-text">
                © 2024 SparkApply. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
`;

const emailTemplates = {
  /**
   * Email Verification Template
   */
  emailVerification: (verificationUrl, userName = 'there') => {
    const content = `
        <div class="content">
            <h1 class="title">Verify Your Email Address</h1>
            <p class="text">Hi ${userName},</p>
            <p class="text">
                Welcome to SparkApply! We're excited to have you join our community of job seekers 
                and employers. To get started, please verify your email address by clicking the button below.
            </p>
            
            <div class="button-container">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p class="text">
                This verification link will expire in 24 hours for security reasons. 
                If you didn't create a SparkApply account, you can safely ignore this email.
            </p>
            
            <div class="divider"></div>
            
            <p class="text">
                <strong>What's next after verification?</strong>
            </p>
            <p class="text">
                • Complete your profile to get better job matches<br>
                • Upload your resume for AI-powered optimization<br>
                • Start discovering jobs with our swipe-based interface<br>
                • Get personalized job recommendations
            </p>
        </div>
    `;
    
    return getBaseTemplate(content, 'Verify Your Email - SparkApply');
  },

  /**
   * Password Reset Template
   */
  passwordReset: (resetUrl, userName = 'there') => {
    const content = `
        <div class="content">
            <h1 class="title">Reset Your Password</h1>
            <p class="text">Hi ${userName},</p>
            <p class="text">
                We received a request to reset your SparkApply account password. 
                If you made this request, click the button below to create a new password.
            </p>
            
            <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="highlight-box">
                <p class="text">
                    <strong>Security Notice:</strong> This password reset link will expire in 1 hour. 
                    If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </p>
            </div>
            
            <p class="text">
                For your security, we recommend choosing a strong password that includes:
            </p>
            <p class="text">
                • At least 8 characters<br>
                • A mix of uppercase and lowercase letters<br>
                • Numbers and special characters<br>
                • Avoid common words or personal information
            </p>
        </div>
    `;
    
    return getBaseTemplate(content, 'Reset Your Password - SparkApply');
  },

  /**
   * Welcome Email Template
   */
  welcome: (userName, profileUrl) => {
    const content = `
        <div class="content">
            <h1 class="title">Welcome to SparkApply! 🎉</h1>
            <p class="text">Hi ${userName},</p>
            <p class="text">
                Congratulations! Your email has been verified and your SparkApply account is now active. 
                You're all set to revolutionize your job search experience with AI-powered matching and discovery.
            </p>
            
            <div class="button-container">
                <a href="${profileUrl}" class="button">Complete Your Profile</a>
            </div>
            
            <p class="text">
                <strong>Here's what you can do now:</strong>
            </p>
            <p class="text">
                🔍 <strong>Discover Jobs</strong> - Use our Tinder-like interface to swipe through opportunities<br>
                🤖 <strong>AI-Powered Applications</strong> - Generate tailored cover letters and optimize your resume<br>
                📊 <strong>Track Applications</strong> - Monitor your job applications in one dashboard<br>
                🎯 <strong>Smart Matching</strong> - Get personalized job recommendations based on your profile
            </p>
            
            <div class="divider"></div>
            
            <p class="text">
                <strong>Pro Tip:</strong> Complete your profile to increase your match scores and get better job recommendations. 
                The more information you provide, the smarter our AI becomes at finding your perfect job!
            </p>
        </div>
    `;
    
    return getBaseTemplate(content, 'Welcome to SparkApply!');
  },

  /**
   * Two-Factor Authentication Code Template
   */
  twoFactorCode: (code, userName = 'there') => {
    const content = `
        <div class="content">
            <h1 class="title">Your Verification Code</h1>
            <p class="text">Hi ${userName},</p>
            <p class="text">
                Here's your verification code for SparkApply. Enter this code to complete your login:
            </p>
            
            <div class="button-container">
                <div class="code">${code}</div>
            </div>
            
            <p class="text">
                This code will expire in 10 minutes for security reasons. 
                If you didn't request this code, please contact our support team immediately.
            </p>
            
            <div class="highlight-box">
                <p class="text">
                    <strong>Security Tip:</strong> Never share this code with anyone. SparkApply will never ask for your verification code via phone or email.
                </p>
            </div>
        </div>
    `;
    
    return getBaseTemplate(content, 'Verification Code - SparkApply');
  },

  /**
   * Account Security Alert Template
   */
  securityAlert: (alertType, details, userName = 'there') => {
    const content = `
        <div class="content">
            <h1 class="title">Security Alert</h1>
            <p class="text">Hi ${userName},</p>
            <p class="text">
                We detected ${alertType} on your SparkApply account and wanted to notify you immediately.
            </p>
            
            <div class="highlight-box">
                <p class="text">
                    <strong>Activity Details:</strong><br>
                    ${details}
                </p>
            </div>
            
            <p class="text">
                If this was you, no action is needed. If you don't recognize this activity, 
                please secure your account immediately by changing your password.
            </p>
            
            <div class="button-container">
                <a href="https://sparkapply.com/account/security" class="button">Secure My Account</a>
            </div>
            
            <p class="text">
                For additional security, consider enabling two-factor authentication on your account.
            </p>
        </div>
    `;
    
    return getBaseTemplate(content, 'Security Alert - SparkApply');
  },

  /**
   * Email Change Confirmation Template
   */
  emailChangeConfirmation: (newEmail, confirmUrl, userName = 'there') => {
    const content = `
        <div class="content">
            <h1 class="title">Confirm Email Change</h1>
            <p class="text">Hi ${userName},</p>
            <p class="text">
                You requested to change your SparkApply account email address to: <strong>${newEmail}</strong>
            </p>
            <p class="text">
                To complete this change, please click the button below to confirm your new email address:
            </p>
            
            <div class="button-container">
                <a href="${confirmUrl}" class="button">Confirm Email Change</a>
            </div>
            
            <div class="highlight-box">
                <p class="text">
                    <strong>Important:</strong> This confirmation link will expire in 24 hours. 
                    If you didn't request this change, please contact our support team immediately.
                </p>
            </div>
        </div>
    `;
    
    return getBaseTemplate(content, 'Confirm Email Change - SparkApply');
  }
};

module.exports = emailTemplates;
