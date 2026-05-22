import { API_BASE } from '@/config/env.ts'
import { AUTH_TOKEN_KEY } from '@/constants/authStorage.ts'

export type LoginUser = {
  _id: string
  email: string
  name: string
  userType: string
  address?: string
  createdAt?: string
  updatedAt?: string
}

export type LoginSuccess = {
  ok: true
  message: string
  token: string
  user: LoginUser
}

export class LoginError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'LoginError'
    this.status = status
  }
}

export class FetchMeError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'FetchMeError'
    this.status = status
  }
}

export { AUTH_TOKEN_KEY }

// 이메일·비밀번호 로그인 요청
export async function loginWithPassword(
  email: string,
  password: string
): Promise<LoginSuccess> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  })

  const data: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : '로그인에 실패했습니다.'
    throw new LoginError(message, res.status)
  }

  if (
    typeof data !== 'object' ||
    data === null ||
    (data as { ok?: unknown }).ok !== true ||
    typeof (data as { token?: unknown }).token !== 'string'
  ) {
    throw new LoginError('로그인에 실패했습니다.', res.status)
  }

  return data as LoginSuccess
}

// Bearer 토큰으로 현재 유저 프로필 조회
export async function fetchCurrentUser(token: string): Promise<LoginUser> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data: unknown = await res.json().catch(() => ({}))

  if (res.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : '사용자 정보를 불러오지 못했습니다.'
    throw new FetchMeError(message, res.status)
  }

  if (
    typeof data !== 'object' ||
    data === null ||
    (data as { ok?: unknown }).ok !== true ||
    typeof (data as { user?: unknown }).user !== 'object' ||
    (data as { user: { name?: unknown } }).user === null
  ) {
    throw new FetchMeError('사용자 정보를 불러오지 못했습니다.', res.status)
  }

  const user = (data as { user: LoginUser }).user
  if (typeof user.name !== 'string') {
    throw new FetchMeError('사용자 정보를 불러오지 못했습니다.', res.status)
  }

  return user
}
