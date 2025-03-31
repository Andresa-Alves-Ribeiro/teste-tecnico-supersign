import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { TOAST_MESSAGES, TOAST_CONFIG } from '@/constants/toast'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockToast,
    toast: mockToast,
  }
})

// Mock fetch
global.fetch = jest.fn()

// Test data
const mockRegisterData = {
  email: 'test@test.com',
  password: 'password',
  name: 'Test User'
}

describe('useAuth Hook', () => {
  const mockRouter = {
    push: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('login', () => {
    it('handles successful login', async () => {
      ;(signIn as jest.Mock).mockResolvedValueOnce({ ok: true, error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login({ email: 'test@test.com', password: 'password' })
      })

      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@test.com',
        password: 'password',
      })
      expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.auth.loginSuccess, TOAST_CONFIG)
      expect(result.current.isLoading).toBe(false)
    })

    it('handles login error', async () => {
      ;(signIn as jest.Mock).mockResolvedValueOnce({ error: 'Invalid credentials' })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login({ email: 'test@test.com', password: 'wrong' })
      })

      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.auth.loginError, TOAST_CONFIG)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('handles successful registration', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ message: 'User registered successfully' }),
        text: () => Promise.resolve(JSON.stringify({ message: 'User registered successfully' }))
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
      ;(signIn as jest.Mock).mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.register(mockRegisterData)
      })

      const expectedBody = JSON.stringify({
        name: mockRegisterData.name,
        email: mockRegisterData.email,
        password: mockRegisterData.password
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/api/register',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String)
        })
      )

      const actualCall = (global.fetch as jest.Mock).mock.calls[0]
      const actualBody = JSON.parse(actualCall[1].body)
      const expectedBodyParsed = JSON.parse(expectedBody)
      expect(actualBody).toEqual(expectedBodyParsed)

      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: mockRegisterData.email,
        password: mockRegisterData.password,
        redirect: false,
      })

      expect(mockRouter.push).toHaveBeenCalledWith('/documents')
      expect(toast.success).toHaveBeenCalledWith(
        TOAST_MESSAGES.auth.registerSuccess,
        TOAST_CONFIG
      )
    })

    it('handles registration error', async () => {
      const mockError = { error: 'Registration failed' }
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve(mockError),
        text: () => Promise.resolve(JSON.stringify(mockError))
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.register(mockRegisterData)
      })

      expect(toast.error).toHaveBeenCalledWith(
        TOAST_MESSAGES.auth.registerError,
        TOAST_CONFIG
      )
    })
  })

  describe('logout', () => {
    it('handles successful logout', async () => {
      ;(signOut as jest.Mock).mockResolvedValueOnce({})

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.logout()
      })

      expect(signOut).toHaveBeenCalledWith({
        redirect: false,
        callbackUrl: '/login',
      })
      expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.auth.logoutSuccess, TOAST_CONFIG)
      expect(result.current.isLoading).toBe(false)
    })

    it('handles logout error', async () => {
      ;(signOut as jest.Mock).mockRejectedValueOnce(new Error('Logout failed'))

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.logout()
      })

      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.auth.logoutError, TOAST_CONFIG)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('manages loading state correctly', () => {
    it('updates loading state during login', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve
      })
      ;(signIn as jest.Mock).mockImplementation(() => signInPromise)

      const { result } = renderHook(() => useAuth())

      let loginPromise: Promise<void>
      act(() => {
        loginPromise = result.current.login({ email: 'test@test.com', password: 'password' })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        resolveSignIn!({ ok: true })
        await loginPromise
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('updates loading state during registration', async () => {
      let resolveFetch: (value: any) => void
      const fetchPromise = new Promise(resolve => {
        resolveFetch = resolve
      })
      ;(global.fetch as jest.Mock).mockImplementation(() => fetchPromise)

      const { result } = renderHook(() => useAuth())

      let registerPromise: Promise<void>
      act(() => {
        registerPromise = result.current.register(mockRegisterData)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        resolveFetch!({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' }),
          text: () => Promise.resolve('Success'),
        })
        await registerPromise
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
}) 