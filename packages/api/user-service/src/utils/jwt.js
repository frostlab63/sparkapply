const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets must be defined in environment variables');
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    return jwt.sign(
      {
        ...payload,
        type: 'access',
        jti: uuidv4(), // JWT ID for token tracking
      },
      this.accessTokenSecret,
      {
        expiresIn: this.accessTokenExpiry,
        issuer: 'sparkapply-user-service',
        audience: 'sparkapply-app',
      }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(
      {
        ...payload,
        type: 'refresh',
        jti: uuidv4(),
      },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'sparkapply-user-service',
        audience: 'sparkapply-app',
      }
    );
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiry(accessToken),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'sparkapply-user-service',
        audience: 'sparkapply-app',
      });
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'sparkapply-user-service',
        audience: 'sparkapply-app',
      });
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }

  /**
   * Get token expiry timestamp
   */
  getTokenExpiry(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return true;
    return Date.now() >= expiry;
  }

  /**
   * Generate email verification token
   */
  generateVerificationToken(email) {
    return jwt.sign(
      {
        email,
        type: 'email_verification',
        jti: uuidv4(),
      },
      this.accessTokenSecret,
      {
        expiresIn: '24h',
        issuer: 'sparkapply-user-service',
        audience: 'sparkapply-app',
      }
    );
  }

  /**
   * Verify email verification token
   */
  verifyVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'sparkapply-user-service',
        audience: 'sparkapply-app',
      });
      
      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error(`Invalid verification token: ${error.message}`);
    }
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(email) {
    return jwt.sign(
      {
        email,
        type: 'password_reset',
        jti: uuidv4(),
      },
      this.accessTokenSecret,
      {
        expiresIn: '1h',
        issuer: 'sparkapply-user-service',
        audience: 'sparkapply-app',
      }
    );
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'sparkapply-user-service',
        audience: 'sparkapply-app',
      });
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error(`Invalid password reset token: ${error.message}`);
    }
  }
}

// Create singleton instance
const jwtService = new JWTService();

module.exports = jwtService;
