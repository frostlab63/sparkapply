import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../RegisterForm'

// Mock the AuthContext
const mockRegister = vi.fn()
const mockClearError = vi.fn()

const createMockAuthContext = (overrides = {}) => ({
  register: mockRegister,
  clearError: mockClearError,
  isLoading: false,
  error: null,
  user: null,
  isAuthenticated: false,
  ...overrides,
})

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => createMockAuthContext()),
}))

// Import useAuth after mocking
import { useAuth } from '../../../contexts/AuthContext'

describe('RegisterForm', () => {
  const mockOnSwitchToLogin = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue(createMockAuthContext())
  })

  it('renders step 1 correctly', () => {
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByText(/job seeker/i)).toBeInTheDocument()
  })

  it('validates email field in step 1', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates password fields in step 1', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    await user.type(confirmPasswordInput, '456')
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('validates password confirmation in step 1', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Different123')
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('proceeds to step 2 with valid step 1 data', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    })
  })

  it('validates required fields in step 2', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    // Complete step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(continueButton)

    // Try to submit step 2 without required fields
    await waitFor(() => {
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      return user.click(createAccountButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
    })
  })

  it('submits complete registration form', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: true })

    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    // Complete step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(continueButton)

    // Complete step 2
    await waitFor(async () => {
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const createAccountButton = screen.getByRole('button', { name: /create account/i })

      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.click(createAccountButton)
    })

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'job_seeker',
      })
    })
  })

  it('allows going back from step 2 to step 1', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    // Complete step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(continueButton)

    // Go back to step 1
    await waitFor(async () => {
      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })
  })

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    const loginLink = screen.getByText(/sign in here/i)
    await user.click(loginLink)

    expect(mockOnSwitchToLogin).toHaveBeenCalled()
  })

  it('displays loading state during submission', () => {
    useAuth.mockReturnValue(createMockAuthContext({ isLoading: true }))

    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    // Should show loading state in step 1
    const continueButton = screen.getByRole('button', { name: /continue/i })
    expect(continueButton).toBeDisabled()
  })

  it('displays error message when registration fails', () => {
    useAuth.mockReturnValue(createMockAuthContext({ error: 'Email already exists' }))

    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    expect(screen.getByText('Email already exists')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    // Find the password toggle button by looking for the Eye icon
    const passwordToggleButton = passwordInput.parentElement.querySelector('button')

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(passwordToggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(passwordToggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('calls onClose when registration is successful', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: true })

    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} onClose={mockOnClose} />)

    // Complete step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(continueButton)

    // Complete step 2
    await waitFor(async () => {
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const createAccountButton = screen.getByRole('button', { name: /create account/i })

      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.click(createAccountButton)
    })

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
