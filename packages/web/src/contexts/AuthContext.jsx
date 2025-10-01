import { createContext, useContext, useReducer, useEffect } from 'react'

// Auth Context
const AuthContext = createContext()

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
}

// Initial State
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  profileCompletion: 0,
}

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        profileCompletion: action.payload.user?.profile_completion || 0,
      }

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
      }

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
        profileCompletion: action.payload.profile_completion || state.profileCompletion,
      }

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      }

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api/v1'

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const accessToken = localStorage.getItem('sparkapply_access_token')
        const refreshToken = localStorage.getItem('sparkapply_refresh_token')
        const user = localStorage.getItem('sparkapply_user')

        if (accessToken && refreshToken && user) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              accessToken,
              refreshToken,
              user: JSON.parse(user),
            },
          })
        }
      } catch (error) {
        console.error('Error loading auth state:', error)
        // Clear invalid data
        localStorage.removeItem('sparkapply_access_token')
        localStorage.removeItem('sparkapply_refresh_token')
        localStorage.removeItem('sparkapply_user')
      }
    }

    loadAuthState()
  }, [])

  // Save auth state to localStorage
  const saveAuthState = (accessToken, refreshToken, user) => {
    localStorage.setItem('sparkapply_access_token', accessToken)
    localStorage.setItem('sparkapply_refresh_token', refreshToken)
    localStorage.setItem('sparkapply_user', JSON.stringify(user))
  }

  // Clear auth state from localStorage
  const clearAuthState = () => {
    localStorage.removeItem('sparkapply_access_token')
    localStorage.removeItem('sparkapply_refresh_token')
    localStorage.removeItem('sparkapply_user')
  }

  // API Helper with auth headers
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (state.accessToken) {
      headers.Authorization = `Bearer ${state.accessToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })

    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (response.success) {
        const { user, accessToken, refreshToken } = response.data
        saveAuthState(accessToken, refreshToken, user)

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, accessToken, refreshToken },
        })

        return { success: true, user }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message,
      })
      return { success: false, error: error.message }
    }
  }

  // Register function
  const register = async userData => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START })

    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })

      if (response.success) {
        const { user, accessToken, refreshToken } = response.data
        saveAuthState(accessToken, refreshToken, user)

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user, accessToken, refreshToken },
        })

        return { success: true, user }
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message,
      })
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      if (state.accessToken) {
        await apiCall('/auth/logout', {
          method: 'POST',
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthState()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }

  // Update profile function
  const updateProfile = async profileData => {
    try {
      const response = await apiCall('/profile/job-seeker', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })

      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: response.data.profile,
        })
        return { success: true, profile: response.data.profile }
      } else {
        throw new Error(response.message || 'Profile update failed')
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get current user profile
  const getCurrentUser = async () => {
    try {
      const response = await apiCall('/auth/me')

      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: response.data.user,
        })
        return { success: true, user: response.data.user }
      } else {
        throw new Error(response.message || 'Failed to get user data')
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    getCurrentUser,
    clearError,
    apiCall,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
