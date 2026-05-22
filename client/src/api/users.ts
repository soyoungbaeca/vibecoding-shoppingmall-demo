import { API_BASE } from '@/config/env.ts'

/** POST /users 요청 본문 (서버 `createUser`와 동일 필드) */
export type RegisterUserPayload = {
  email: string
  name: string
  password: string
  userType: 'customer' | 'admin'
  address?: string
}

export class RegisterUserError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'RegisterUserError'
    this.status = status
  }
}

/**
 * 회원가입 — MongoDB에 유저 문서를 저장합니다 (서버 `User.create`).
 * 성공 시 생성된 유저 JSON(비밀번호 제외)을 반환합니다.
 */
export async function registerUser(
  payload: RegisterUserPayload
): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new RegisterUserError(
      '서버에 연결할 수 없습니다. 백엔드(npm run dev)가 실행 중인지 확인해 주세요.',
      0
    )
  }

  const data: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : '회원가입에 실패했습니다.'
    throw new RegisterUserError(message, res.status)
  }

  return data
}
