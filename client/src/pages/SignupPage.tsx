import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, RegisterUserError } from '@/api/users.ts'
import { isValidEmail } from '@/utils/email.ts'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [address, setAddress] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(email)) {
      setError('올바른 이메일 형식을 입력해 주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!agreedTerms) {
      setError('Terms and conditions에 동의해 주세요.')
      return
    }

    setLoading(true)
    try {
      const payload: {
        email: string
        name: string
        password: string
        userType: 'customer'
        address?: string
      } = { email: email.trim(), name, password, userType: 'customer' }
      const trimmed = address.trim()
      if (trimmed) payload.address = trimmed

      await registerUser(payload)

      navigate('/', { replace: true, state: { signupOk: true } })
    } catch (err) {
      if (err instanceof RegisterUserError) {
        setError(err.message)
      } else {
        setError('네트워크 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page signup-page">
      <header className="page-header">
        <h1 className="page-title">회원가입</h1>
        <p className="page-lead">아래 정보를 입력해 주세요.</p>
      </header>

      <form className="signup-form" onSubmit={handleSubmit}>
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
          />
        </label>

        <label className="field">
          <span className="field-label">
            이름 <abbr title="필수">*</abbr>
          </span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
          />
        </label>

        <label className="field">
          <span className="field-label">
            비밀번호 <abbr title="필수">*</abbr>
          </span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
          />
        </label>

        <label className="field">
          <span className="field-label">
            비밀번호 확인 <abbr title="필수">*</abbr>
          </span>
          <input
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="field-input"
            placeholder="비밀번호를 다시 입력하세요"
          />
        </label>

        <label className="field">
          <span className="field-label">주소</span>
          <textarea
            name="address"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="field-input field-textarea"
            placeholder="선택 사항"
          />
        </label>

        <label className="field field-checkbox">
          <input
            type="checkbox"
            name="agreedTerms"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="field-checkbox-input"
          />
          <span className="field-checkbox-label">
            Terms and conditions에 동의합니다.
          </span>
        </label>

        <div className="form-actions">
          <Link to="/" className="btn btn-ghost">
            취소
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '처리 중…' : '가입하기'}
          </button>
        </div>

        <p className="auth-footer-text">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="auth-inline-link">
            로그인
          </Link>
        </p>
      </form>
    </div>
  )
}
