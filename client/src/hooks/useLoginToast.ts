import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { LocationState } from '@/types/locationState.ts'

const TOAST_DURATION_MS = 3800

// 로그인·회원가입 직후 홈 토스트 (동일 스타일·3.8초 후 state 정리)
export function useLoginToast(): string | null {
  const location = useLocation()
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  const handledLoginRef = useRef(false)
  const handledSignupRef = useRef(false)

  useEffect(() => {
    const s = location.state as LocationState | null

    if (s?.loginOk) {
      if (handledLoginRef.current) return
      handledLoginRef.current = true

      const name = typeof s.userName === 'string' ? s.userName.trim() : ''
      setMessage(name ? `${name}님, 환영합니다.` : '로그인되었습니다.')

      const tid = window.setTimeout(() => {
        setMessage(null)
        const next: LocationState = {}
        if (s.signupOk) next.signupOk = true
        navigate(location.pathname, {
          replace: true,
          state: Object.keys(next).length > 0 ? next : undefined,
        })
      }, TOAST_DURATION_MS)

      return () => {
        window.clearTimeout(tid)
        handledLoginRef.current = false
      }
    }

    if (!s?.loginOk) handledLoginRef.current = false

    if (s?.signupOk) {
      if (handledSignupRef.current) return
      handledSignupRef.current = true

      setMessage('회원가입이 완료되었습니다.')

      const tid = window.setTimeout(() => {
        setMessage(null)
        navigate(location.pathname, { replace: true, state: undefined })
      }, TOAST_DURATION_MS)

      return () => {
        window.clearTimeout(tid)
        handledSignupRef.current = false
      }
    }

    if (!s?.signupOk) handledSignupRef.current = false
  }, [location.pathname, location.state, navigate])

  return message
}
