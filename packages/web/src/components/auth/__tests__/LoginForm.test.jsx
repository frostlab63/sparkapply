import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../LoginForm'

// Mock the AuthContext
const mockLogin = vi.fn()
const mockClearError = vi.fn()

const createMockAuthContext = (overrides = {}) => ({
  login: mockLogin,
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

describe('LoginForm', () => {
  const mockOnSwitchToRegister = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue(createMockAuthContext())
  })

  it('renders login form correctly', () => {
    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your SparkApply account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates email field', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates password field', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })

    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('calls onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    const registerLink = screen.getByText(/create account here/i)
    await user.click(registerLink)

    expect(mockOnSwitchToRegister).toHaveBeenCalled()
  })

  it('displays loading state during submission', () => {
    useAuth.mockReturnValue(createMockAuthContext({ isLoading: true }))

    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    const submitButton = screen.getByRole('button', { name: /signing in/i })
    expect(submitButton).toBeDisabled()
  })

  it('displays error message when login fails', () => {
    useAuth.mockReturnValue(createMockAuthContext({ error: 'Invalid credentials' }))

    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('calls onClose when login is successful', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })

    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} onClose={mockOnClose} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
