import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../RegisterForm'
import { AuthProvider } from '../../../contexts/AuthContext'

// Mock the AuthContext
const mockRegister = vi.fn()
const mockAuthContext = {
  register: mockRegister,
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

describe('RegisterForm', () => {
  const mockOnSwitchToLogin = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders step 1 correctly', () => {
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByText(/job seeker/i)).toBeInTheDocument()
  })

  it('validates email in step 1', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    const continueButton = screen.getByRole('button', { name: /continue/i })
    await user.click(continueButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('validates password match in step 1', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'differentpassword')
    await user.click(continueButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('proceeds to step 2 with valid step 1 data', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(continueButton)
    
    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument()
      expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
    })
  })

  it('renders step 2 correctly', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    // Complete step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(continueButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByText(/terms of service/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })
  })

  it('validates required fields in step 2', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    // Complete step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(continueButton)
    
    // Try to submit step 2 without required fields
    await waitFor(() => {
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      return user.click(createAccountButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument()
    })
  })

  it('submits complete registration form', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    // Complete step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(continueButton)
    
    // Complete step 2
    await waitFor(async () => {
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const termsCheckbox = screen.getByRole('checkbox')
      const createAccountButton = screen.getByRole('button', { name: /create account/i })
      
      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.click(termsCheckbox)
      await user.click(createAccountButton)
    })
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        role: 'job_seeker',
        firstName: 'John',
        lastName: 'Doe'
      })
    })
  })

  it('allows going back from step 2 to step 1', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    // Complete step 1
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const continueButton = screen.getByRole('button', { name: /continue/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(continueButton)
    
    // Go back to step 1
    await waitFor(async () => {
      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    })
  })

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />)
    
    const loginLink = screen.getByText(/sign in here/i)
    await user.click(loginLink)
    
    expect(mockOnSwitchToLogin).toHaveBeenCalled()
  })
})
