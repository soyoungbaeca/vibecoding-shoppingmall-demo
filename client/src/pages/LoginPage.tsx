import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { LocationState } from '@/types/locationState.ts'
import { AUTH_TOKEN_KEY, loginWithPassword, LoginError } from '@/api/auth.ts'
import { useAuth } from '@/contexts/AuthContext.tsx'
import { isValidEmail } from '@/utils/email.ts'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as LocationState | null)?.from ?? '/'
  const { isLoggedIn, isLoading, setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 이미 로그인된 경우 원래 목적지 또는 메인으로 이동
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      navigate(returnTo, { replace: true })
    }
  }, [isLoading, isLoggedIn, navigate, returnTo])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(email)) {
      setError('올바른 이메일 형식을 입력해 주세요.')
      return
    }

    setLoading(true)
    try {
      const result = await loginWithPassword(email, password)
      localStorage.setItem(AUTH_TOKEN_KEY, result.token)
      setUser({ name: result.user.name, userType: result.user.userType })
      if (returnTo === '/') {
        navigate('/', {
          replace: true,
          state: { loginOk: true, userName: result.user.name },
        })
      } else {
        navigate(returnTo, { replace: true })
      }
    } catch (err) {
      if (err instanceof LoginError) {
        setError(err.message)
      } else {
        setError('네트워크 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="page login-page">
        <p className="login-session-check" role="status">
          세션 확인 중…
        </p>
      </div>
    )
  }

  return (
    <div className="page login-page">
      <header className="login-header">
        <div className="login-brand" aria-hidden>
          <span className="login-brand-mark" />
        </div>
        <h1 className="page-title">로그인</h1>
        <p className="page-lead">이메일과 비밀번호로 쇼핑몰에 들어오세요.</p>
      </header>

      <div className="auth-card">
        <div className="auth-card-accent" aria-hidden />
        <form className="auth-card-form" onSubmit={handleSubmit}>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <label className="field">
            <span className="field-label">
              이메일 <abbr title="필수">*</abbr>
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              placeholder="you@example.com"
            />
          </label>

          <label className="field">
            <span className="field-label">
              비밀번호 <abbr title="필수">*</abbr>
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
              placeholder="비밀번호"
            />
          </label>

          <div className="form-actions login-form-actions">
            <Link to="/" className="btn btn-ghost">
              홈
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '로그인 중…' : '로그인'}
            </button>
          </div>

          <p className="auth-footer-text">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="auth-inline-link">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
