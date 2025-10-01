import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../LoginForm'
import { AuthProvider } from '../../../contexts/AuthContext'

// Mock the AuthContext
const mockLogin = vi.fn()
const mockAuthContext = {
  login: mockLogin,
  loading: false,
  error: null,
  user: null,
  isAuthenticated: false
}

vi.mock('../../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../../contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => mockAuthContext
  }
})

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('LoginForm', () => {
  const mockOnSwitchToRegister = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form correctly', () => {
    renderWithAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your SparkApply account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates email field', async () => {
    const user = userEvent.setup()
    renderWithAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
    
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
    renderWithAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
    
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
    renderWithAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderWithAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
    
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
    renderWithAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
    
    const registerLink = screen.getByText(/create account here/i)
    await user.click(registerLink)
    
    expect(mockOnSwitchToRegister).toHaveBeenCalled()
  })

  it('displays loading state during submission', () => {
    mockAuthContext.loading = true
    renderWithAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
    
    const submitButton = screen.getByRole('button', { name: /signing in/i })
    expect(submitButton).toBeDisabled()
  })

  it('displays error message when login fails', () => {
    mockAuthContext.error = 'Invalid credentials'
    renderWithAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />)
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })
})
