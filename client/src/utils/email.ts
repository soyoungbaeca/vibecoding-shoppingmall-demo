/** 로컬@도메인.최상위 형태 (RFC 전체는 아님). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  const s = email.trim()
  if (!s || s.length > 254) return false
  return EMAIL_RE.test(s)
}
