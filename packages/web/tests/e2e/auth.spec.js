import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page correctly', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: /swipe your way to your dream job/i })).toBeVisible()
    
    // Check navigation
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'How it Works' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible()
    
    // Check CTA buttons
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })

  test('should open registration modal when clicking Get Started', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Check modal is visible
    await expect(page.getByText('Create Your Account')).toBeVisible()
    await expect(page.getByText('Step 1 of 2')).toBeVisible()
    
    // Check form fields
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
  })

  test('should validate email format in registration', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Fill invalid email
    await page.getByLabel(/email address/i).fill('invalid-email')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Check validation message
    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible()
  })

  test('should validate password confirmation', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Fill form with mismatched passwords
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByLabel(/^password$/i).fill('password123')
    await page.getByLabel(/confirm password/i).fill('differentpassword')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Check validation message
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })

  test('should proceed to step 2 with valid step 1 data', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Fill step 1 correctly
    await page.getByLabel(/email address/i).fill('newuser@example.com')
    await page.getByLabel(/^password$/i).fill('password123')
    await page.getByLabel(/confirm password/i).fill('password123')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Check step 2 is visible
    await expect(page.getByText('Complete Your Profile')).toBeVisible()
    await expect(page.getByText('Step 2 of 2')).toBeVisible()
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
  })

  test('should validate required fields in step 2', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Complete step 1
    await page.getByLabel(/email address/i).fill('newuser@example.com')
    await page.getByLabel(/^password$/i).fill('password123')
    await page.getByLabel(/confirm password/i).fill('password123')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Try to submit step 2 without filling required fields
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Check validation messages
    await expect(page.getByText(/first name is required/i)).toBeVisible()
    await expect(page.getByText(/last name is required/i)).toBeVisible()
    await expect(page.getByText(/you must agree to the terms/i)).toBeVisible()
  })

  test('should handle existing user registration', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Complete step 1 with existing email
    await page.getByLabel(/email address/i).fill('test@sparkapply.com')
    await page.getByLabel(/^password$/i).fill('password123')
    await page.getByLabel(/confirm password/i).fill('password123')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Complete step 2
    await page.getByLabel(/first name/i).fill('John')
    await page.getByLabel(/last name/i).fill('Doe')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Check error message for existing user
    await expect(page.getByText(/user already exists with this email/i)).toBeVisible()
  })

  test('should allow going back from step 2 to step 1', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Complete step 1
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByLabel(/^password$/i).fill('password123')
    await page.getByLabel(/confirm password/i).fill('password123')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Go back to step 1
    await page.getByRole('button', { name: 'Back' }).click()
    
    // Check we're back to step 1
    await expect(page.getByText('Create Your Account')).toBeVisible()
    await expect(page.getByText('Step 1 of 2')).toBeVisible()
  })

  test('should switch between login and register modes', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Switch to login
    await page.getByText(/sign in here/i).click()
    await expect(page.getByText('Welcome Back')).toBeVisible()
    
    // Switch back to register
    await page.getByText(/create account here/i).click()
    await expect(page.getByText('Create Your Account')).toBeVisible()
  })

  test('should close modal when clicking close button', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Close modal
    await page.getByRole('button', { name: 'Close modal' }).click()
    
    // Check modal is closed
    await expect(page.getByText('Create Your Account')).not.toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    const passwordInput = page.getByLabel(/^password$/i)
    const toggleButton = page.getByRole('button').filter({ hasText: /show|hide/i }).first()
    
    // Check initial state (password hidden)
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Toggle back to hide password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check landing page is responsive
    await expect(page.getByRole('heading', { name: /swipe your way to your dream job/i })).toBeVisible()
    
    // Open modal and check it's responsive
    await page.getByRole('button', { name: 'Get Started' }).click()
    await expect(page.getByText('Create Your Account')).toBeVisible()
    
    // Check form fields are accessible on mobile
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
  })
})
