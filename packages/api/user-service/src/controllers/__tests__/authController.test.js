const request = require('supertest')
const express = require('express')
const { User, JobSeekerProfile } = require('../../models')
const authController = require('../authController')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// Create test app
const app = express()
app.use(express.json())
app.post('/register', authController.register)
app.post('/login', authController.login)
app.post('/refresh', authController.refreshToken)
app.get('/me', authController.getMe)

describe('Auth Controller', () => {
  beforeEach(async () => {
    // Clear database before each test
    await User.destroy({ where: {}, force: true })
    await JobSeekerProfile.destroy({ where: {}, force: true })
  })

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'job_seeker',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User registered successfully')
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.role).toBe(userData.role)
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()

      // Verify user was created in database
      const user = await User.findOne({ where: { email: userData.email } })
      expect(user).toBeTruthy()
      expect(user.email).toBe(userData.email)

      // Verify profile was created for job seeker
      const profile = await JobSeekerProfile.findOne({ where: { user_id: user.id } })
      expect(profile).toBeTruthy()
      expect(profile.first_name).toBe(userData.firstName)
      expect(profile.last_name).toBe(userData.lastName)
    })

    it('should return error for duplicate email', async () => {
      // Create user first
      await User.create({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'job_seeker'
      })

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'job_seeker',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User already exists with this email')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/register')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        role: 'job_seeker',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should validate password strength', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too short
        role: 'job_seeker',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash('password123', 10)
      await User.create({
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'job_seeker',
        is_verified: true,
        is_active: true
      })
    })

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()
    })

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should return error for inactive user', async () => {
      // Update user to inactive
      await User.update(
        { is_active: false },
        { where: { email: 'test@example.com' } }
      )

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Account is deactivated')
    })

    it('should update last_login timestamp', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      await request(app)
        .post('/login')
        .send(loginData)
        .expect(200)

      const user = await User.findOne({ where: { email: loginData.email } })
      expect(user.last_login).toBeTruthy()
    })
  })

  describe('POST /refresh', () => {
    let refreshToken

    beforeEach(async () => {
      // Create test user and generate refresh token
      const user = await User.create({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'job_seeker',
        is_verified: true,
        is_active: true
      })

      refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        { expiresIn: '7d' }
      )
    })

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid refresh token')
    })

    it('should return error for missing refresh token', async () => {
      const response = await request(app)
        .post('/refresh')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /me', () => {
    let accessToken
    let user

    beforeEach(async () => {
      // Create test user
      user = await User.create({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'job_seeker',
        is_verified: true,
        is_active: true
      })

      // Generate access token
      accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      )
    })

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(user.email)
      expect(response.body.data.user.role).toBe(user.role)
    })

    it('should return error for missing token', async () => {
      const response = await request(app)
        .get('/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Access token required')
    })

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid token')
    })
  })
})
