const { User, JobSeekerProfile } = require('../models');
const jwtService = require('../utils/jwt');
const emailService = require('../utils/email');
const { sanitizers } = require('../utils/validation');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const { email, password, role = 'job_seeker' } = req.body;
      
      // Sanitize input
      const sanitizedEmail = sanitizers.sanitizeEmail(email);
      
      // Check if user already exists
      const existingUser = await User.findByEmail(sanitizedEmail);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email',
          error: 'USER_EXISTS',
        });
      }

      // Create user
      const user = await User.create({
        email: sanitizedEmail,
        password_hash: password, // Will be hashed by the model hook
        role,
        verification_token: jwtService.generateVerificationToken(sanitizedEmail),
      });

      // Create profile based on role
      if (role === 'job_seeker') {
        await JobSeekerProfile.create({
          user_id: user.id,
        });
      }

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, user.verification_token);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      // Generate tokens (user can use the app even without verification)
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user: user.toJSON(),
          ...tokens,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: 'REGISTRATION_FAILED',
      });
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Sanitize input
      const sanitizedEmail = sanitizers.sanitizeEmail(email);
      
      // Find user
      const user = await User.findByEmail(sanitizedEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS',
        });
      }

      // Check password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS',
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
          error: 'ACCOUNT_DEACTIVATED',
        });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate tokens
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          ...tokens,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: 'LOGIN_FAILED',
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error: 'MISSING_REFRESH_TOKEN',
        });
      }

      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);
      
      // Find user
      const user = await User.findByPk(decoded.userId);
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          error: 'INVALID_REFRESH_TOKEN',
        });
      }

      // Generate new tokens
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'INVALID_REFRESH_TOKEN',
      });
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      // Verify token
      const decoded = jwtService.verifyVerificationToken(token);
      
      // Find user
      const user = await User.findByEmail(decoded.email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
          error: 'ALREADY_VERIFIED',
        });
      }

      // Update user verification status
      await user.update({
        is_verified: true,
        verification_token: null,
      });

      // Send welcome email
      try {
        const profile = await JobSeekerProfile.findOne({ where: { user_id: user.id } });
        const firstName = profile?.first_name;
        await emailService.sendWelcomeEmail(user.email, firstName);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
        error: 'INVALID_VERIFICATION_TOKEN',
      });
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;
      
      // Sanitize input
      const sanitizedEmail = sanitizers.sanitizeEmail(email);
      
      // Find user
      const user = await User.findByEmail(sanitizedEmail);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          success: true,
          message: 'If an account with this email exists, a verification email has been sent.',
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
          error: 'ALREADY_VERIFIED',
        });
      }

      // Generate new verification token
      const verificationToken = jwtService.generateVerificationToken(user.email);
      await user.update({ verification_token: verificationToken });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email',
          error: 'EMAIL_SEND_FAILED',
        });
      }

      res.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend verification email',
        error: 'RESEND_VERIFICATION_FAILED',
      });
    }
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      // Sanitize input
      const sanitizedEmail = sanitizers.sanitizeEmail(email);
      
      // Find user
      const user = await User.findByEmail(sanitizedEmail);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          success: true,
          message: 'If an account with this email exists, a password reset email has been sent.',
        });
      }

      // Generate reset token
      const resetToken = jwtService.generatePasswordResetToken(user.email);
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await user.update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      });

      // Send reset email
      try {
        await emailService.sendPasswordResetEmail(user.email, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send password reset email',
          error: 'EMAIL_SEND_FAILED',
        });
      }

      res.json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: 'FORGOT_PASSWORD_FAILED',
      });
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      // Verify reset token
      const decoded = jwtService.verifyPasswordResetToken(token);
      
      // Find user
      const user = await User.findByEmail(decoded.email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }

      // Check if token matches and hasn't expired
      if (user.reset_token !== token || new Date() > user.reset_token_expires) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
          error: 'INVALID_RESET_TOKEN',
        });
      }

      // Update password and clear reset token
      await user.update({
        password_hash: password, // Will be hashed by the model hook
        reset_token: null,
        reset_token_expires: null,
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        error: 'INVALID_RESET_TOKEN',
      });
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, password } = req.body;
      
      // Find user
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
          error: 'INVALID_CURRENT_PASSWORD',
        });
      }

      // Update password
      await user.update({
        password_hash: password, // Will be hashed by the model hook
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: 'CHANGE_PASSWORD_FAILED',
      });
    }
  }

  /**
   * Logout user (client-side token invalidation)
   */
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is primarily handled client-side
      // by removing the tokens from storage. We can log this event.
      
      console.log(`User ${req.user.id} logged out at ${new Date().toISOString()}`);
      
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: 'LOGOUT_FAILED',
      });
    }
  }

  /**
   * Get current user info
   */
  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: JobSeekerProfile,
            as: 'jobSeekerProfile',
          },
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information',
        error: 'GET_USER_FAILED',
      });
    }
  }
}

module.exports = new AuthController();
