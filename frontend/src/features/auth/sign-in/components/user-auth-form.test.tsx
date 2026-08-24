import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'

const navigate = vi.hoisted(() => vi.fn())
const setUserMock = vi.hoisted(() => vi.fn())
const setAccessTokenMock = vi.hoisted(() => vi.fn())
const resetMock = vi.hoisted(() => vi.fn())
const meMock = vi.hoisted(() => vi.fn())

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    auth: {
      setUser: setUserMock,
      setAccessToken: setAccessTokenMock,
      reset: resetMock,
    },
  }),
}))

vi.mock('@/lib/api', () => ({
  usersApi: {
    me: meMock,
  },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('UserAuthForm', () => {
  let screen: RenderResult
  let tokenInput: Locator
  let signInButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()
    screen = await render(<UserAuthForm />)
    tokenInput = screen.getByLabelText(/^API token$/i)
    signInButton = screen.getByRole('button', { name: /^Sign in$/i })
  })

  it('renders the token field and submit button', async () => {
    await expect.element(tokenInput).toBeInTheDocument()
    await expect.element(signInButton).toBeInTheDocument()
  })

  it('shows a validation message when submitting an empty token', async () => {
    await userEvent.click(signInButton)

    await expect
      .element(screen.getByText('Please enter your API token.'))
      .toBeInTheDocument()
  })

  it('validates the token, stores the user, and navigates on success', async () => {
    meMock.mockResolvedValue({
      username: 'alice',
      email: 'alice@example.com',
      accountNumber: 'ACC001',
      roles: ['ROLE_USER'],
    })
    await userEvent.fill(tokenInput, 'abc123')
    await userEvent.click(signInButton)

    await vi.waitFor(() => expect(setAccessTokenMock).toHaveBeenCalledWith('abc123'))
    expect(meMock).toHaveBeenCalledOnce()
    await vi.waitFor(() =>
      expect(setUserMock).toHaveBeenCalledWith({
        accountNo: 'ACC001',
        email: 'alice@example.com',
        role: ['ROLE_USER'],
        exp: 0,
      })
    )
    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
    )
  })

  it('resets auth and shows an error when the token is invalid', async () => {
    meMock.mockRejectedValue(new Error('401'))
    await userEvent.fill(tokenInput, 'bad-token')
    await userEvent.click(signInButton)

    await vi.waitFor(() => expect(resetMock).toHaveBeenCalledOnce())
    expect(navigate).not.toHaveBeenCalled()
  })
})
