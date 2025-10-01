import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const RegisterForm = ({ onSwitchToLogin, onClose }) => {
  const { register, isLoading, error, clearError } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'job_seeker',
    firstName: '',
    lastName: '',
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 2

  // Form validation for each step
  const validateStep = step => {
    const errors = {}

    if (step === 1) {
      // Email validation
      if (!formData.email) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }

      // Password validation
      if (!formData.password) {
        errors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters'
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number'
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }

    if (step === 2) {
      // First name validation
      if (!formData.firstName) {
        errors.firstName = 'First name is required'
      } else if (formData.firstName.length < 2) {
        errors.firstName = 'First name must be at least 2 characters'
      }

      // Last name validation
      if (!formData.lastName) {
        errors.lastName = 'Last name is required'
      } else if (formData.lastName.length < 2) {
        errors.lastName = 'Last name must be at least 2 characters'
      }

      // Terms agreement validation
      if (!formData.agreeToTerms) {
        errors.agreeToTerms = 'You must agree to the terms and conditions'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle input change
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }

    // Clear global error
    if (error) {
      clearError()
    }
  }

  // Handle next step
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault()

    if (!validateStep(currentStep)) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userType: formData.role,
      })

      if (result.success) {
        // Registration successful - close modal or redirect
        if (onClose) {
          onClose()
        }
      }
    } catch (err) {
      console.error('Registration error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render step 1 - Account Details
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
          />
        </div>
        {validationErrors.email && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {validationErrors.password && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.password}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {validationErrors.confirmPassword && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">I am a...</label>
        <div className="grid grid-cols-1 gap-3">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="role"
              value="job_seeker"
              checked={formData.role === 'job_seeker'}
              onChange={handleInputChange}
              className="text-orange-500 focus:ring-orange-500"
            />
            <Briefcase className="w-5 h-5 ml-3 mr-2 text-orange-500" />
            <div>
              <div className="font-medium text-gray-900">Job Seeker</div>
              <div className="text-sm text-gray-500">Looking for opportunities</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )

  // Render step 2 - Personal Details
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* First Name Field */}
      <div className="space-y-2">
        <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
          First Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              validationErrors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter your first name"
          />
        </div>
        {validationErrors.firstName && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.firstName}
          </p>
        )}
      </div>

      {/* Last Name Field */}
      <div className="space-y-2">
        <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
          Last Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              validationErrors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter your last name"
          />
        </div>
        {validationErrors.lastName && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.lastName}
          </p>
        )}
      </div>

      {/* Terms Agreement */}
      <div className="space-y-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className="mt-1 text-orange-500 focus:ring-orange-500 rounded"
          />
          <div className="text-sm text-gray-600">
            I agree to the{' '}
            <a href="#" className="text-orange-600 hover:text-orange-700 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-orange-600 hover:text-orange-700 underline">
              Privacy Policy
            </a>
          </div>
        </label>
        {validationErrors.agreeToTerms && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.agreeToTerms}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-xl">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-4 py-2">
            <User className="w-4 h-4 mr-2" />
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {currentStep === 1 ? 'Create Your Account' : 'Complete Your Profile'}
        </CardTitle>
        <CardDescription className="text-gray-500">
          {currentStep === 1
            ? 'Set up your SparkApply account credentials'
            : 'Tell us a bit about yourself'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={currentStep === totalSteps ? handleSubmit : e => e.preventDefault()}
          className="space-y-6"
        >
          {/* Global Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Switch to Login */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                disabled={isSubmitting}
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default RegisterForm
