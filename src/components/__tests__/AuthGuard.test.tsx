import { render } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AuthGuard from '../AuthGuard'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('AuthGuard Component', () => {
  const mockChildren = <div>Protected Content</div>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state when status is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading'
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows children when status is unauthenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('shows children when status is authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@test.com' } },
      status: 'authenticated'
    })

    const { container } = render(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(container.firstChild).not.toBeNull()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('returns null when status is not one of the expected states', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unknown'
    })

    const { container } = render(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(container.firstChild).toBeNull()
  })
}) 