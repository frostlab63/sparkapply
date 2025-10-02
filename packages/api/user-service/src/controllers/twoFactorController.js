const { User } = require('../models');
const emailService = require('../utils/email');
const crypto = require('crypto');

/**
 * Two-Factor Authentication Controller
 * Handles 2FA setup, verification, and management
 */
class TwoFactorController {
  /**
   * Generate and send 2FA code via email
   */
  async sendTwoFactorCode(req, res) {
    try {
      const { email } = req.body;
      
      // Find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({
          success: true,
          message: 'If an account with this email exists, a verification code has been sent.',
        });
      }

      // Generate 6-digit code
      const code = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store code in user record (in production, use Redis for better performance)
      await user.update({
        two_factor_code: code,
        two_factor_expires: expiresAt,
      });

      // Send code via email
      await emailService.sendTwoFactorCode(email, code, user.first_name);

      res.json({
        success: true,
        message: 'Verification code sent to your email address.',
        expiresIn: 600, // 10 minutes in seconds
      });
    } catch (error) {
      console.error('Send 2FA code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
        error: 'SEND_2FA_CODE_FAILED',
      });
    }
  }

  /**
   * Verify 2FA code
   */
  async verifyTwoFactorCode(req, res) {
    try {
      const { email, code } = req.body;
      
      // Find user with valid 2FA code
      const user = await User.findOne({
        where: {
          email,
          two_factor_code: code,
          two_factor_expires: {
            [require('sequelize').Op.gt]: new Date(),
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code',
          error: 'INVALID_2FA_CODE',
        });
      }

      // Clear the 2FA code
      await user.update({
        two_factor_code: null,
        two_factor_expires: null,
        two_factor_verified: true,
      });

      res.json({
        success: true,
        message: 'Verification code confirmed successfully',
        data: {
          verified: true,
          userId: user.id,
        },
      });
    } catch (error) {
      console.error('Verify 2FA code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify code',
        error: 'VERIFY_2FA_CODE_FAILED',
      });
    }
  }

  /**
   * Enable 2FA for user account
   */
  async enableTwoFactor(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }

      // Enable 2FA
      await user.update({
        two_factor_enabled: true,
      });

      res.json({
        success: true,
        message: 'Two-factor authentication enabled successfully',
        data: {
          twoFactorEnabled: true,
        },
      });
    } catch (error) {
      console.error('Enable 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enable two-factor authentication',
        error: 'ENABLE_2FA_FAILED',
      });
    }
  }

  /**
   * Disable 2FA for user account
   */
  async disableTwoFactor(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }

      // Verify password before disabling 2FA
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password',
          error: 'INVALID_PASSWORD',
        });
      }

      // Disable 2FA
      await user.update({
        two_factor_enabled: false,
        two_factor_code: null,
        two_factor_expires: null,
        two_factor_verified: false,
      });

      res.json({
        success: true,
        message: 'Two-factor authentication disabled successfully',
        data: {
          twoFactorEnabled: false,
        },
      });
    } catch (error) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disable two-factor authentication',
        error: 'DISABLE_2FA_FAILED',
      });
    }
  }

  /**
   * Get 2FA status for user
   */
  async getTwoFactorStatus(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId, {
        attributes: ['id', 'two_factor_enabled'],
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
          twoFactorEnabled: user.two_factor_enabled || false,
        },
      });
    } catch (error) {
      console.error('Get 2FA status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get two-factor authentication status',
        error: 'GET_2FA_STATUS_FAILED',
      });
    }
  }

  /**
   * Generate backup codes for 2FA
   */
  async generateBackupCodes(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }

      if (!user.two_factor_enabled) {
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication must be enabled first',
          error: '2FA_NOT_ENABLED',
        });
      }

      // Generate 10 backup codes
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        backupCodes.push(code);
      }

      // Hash and store backup codes
      const hashedCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      await user.update({
        backup_codes: JSON.stringify(hashedCodes),
      });

      res.json({
        success: true,
        message: 'Backup codes generated successfully',
        data: {
          backupCodes,
          warning: 'Store these codes in a safe place. They can only be used once and will not be shown again.',
        },
      });
    } catch (error) {
      console.error('Generate backup codes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate backup codes',
        error: 'GENERATE_BACKUP_CODES_FAILED',
      });
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(req, res) {
    try {
      const { email, backupCode } = req.body;
      
      const user = await User.findOne({ where: { email } });
      if (!user || !user.two_factor_enabled || !user.backup_codes) {
        return res.status(400).json({
          success: false,
          message: 'Invalid backup code',
          error: 'INVALID_BACKUP_CODE',
        });
      }

      // Hash the provided backup code
      const hashedCode = crypto.createHash('sha256').update(backupCode.toUpperCase()).digest('hex');
      
      // Check if code exists in backup codes
      const backupCodes = JSON.parse(user.backup_codes);
      const codeIndex = backupCodes.indexOf(hashedCode);
      
      if (codeIndex === -1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid backup code',
          error: 'INVALID_BACKUP_CODE',
        });
      }

      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await user.update({
        backup_codes: JSON.stringify(backupCodes),
      });

      res.json({
        success: true,
        message: 'Backup code verified successfully',
        data: {
          verified: true,
          userId: user.id,
          remainingCodes: backupCodes.length,
        },
      });
    } catch (error) {
      console.error('Verify backup code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify backup code',
        error: 'VERIFY_BACKUP_CODE_FAILED',
      });
    }
  }
}

module.exports = new TwoFactorController();
