/**
 * 실무에서 흔히 쓰는 이메일 형태 검사 (로컬@도메인.최상위도메인).
 * RFC 전체 호환은 아님.
 * @param {unknown} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const s = email.trim();
  if (!s || s.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
