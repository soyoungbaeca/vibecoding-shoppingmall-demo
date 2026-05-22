import { useCallback, useEffect, useRef, useState } from 'react'

// 일정 시간 후 자동으로 사라지는 토스트
export function useToast(durationMs = 3200) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const showToast = useCallback(
    (text: string) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
      setMessage(text)
      timerRef.current = window.setTimeout(() => {
        setMessage(null)
        timerRef.current = null
      }, durationMs)
    },
    [durationMs]
  )

  const clearToast = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setMessage(null)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { toast: message, showToast, clearToast }
}
