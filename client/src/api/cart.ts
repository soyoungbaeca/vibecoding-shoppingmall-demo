import { API_BASE } from '@/config/env.ts'
import { AUTH_TOKEN_KEY } from '@/constants/authStorage.ts'
import type { Cart } from '@/types/cart.ts'

export class CartApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'CartApiError'
    this.status = status
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) {
    throw new CartApiError('로그인이 필요합니다.', 401)
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  const data: unknown = await res.json().catch(() => ({}))
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
  ) {
    return (data as { message: string }).message
  }
  return '요청에 실패했습니다.'
}

function parseCartPayload(data: unknown): Cart {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as { cart?: unknown }).cart !== 'object' ||
    (data as { cart: unknown }).cart === null
  ) {
    throw new CartApiError('장바구니 데이터 형식이 올바르지 않습니다.', 500)
  }
  return (data as { cart: Cart }).cart
}

// GET /cart
export async function fetchCart(): Promise<Cart> {
  const res = await fetch(`${API_BASE}/cart`, { headers: authHeaders() })
  if (!res.ok) {
    throw new CartApiError(await parseErrorMessage(res), res.status)
  }
  const data: unknown = await res.json()
  return parseCartPayload(data)
}

// POST /cart/items
export async function addCartItem(body: {
  productSlug: string
  variantId: string
  quantity?: number
}): Promise<Cart> {
  const res = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new CartApiError(await parseErrorMessage(res), res.status)
  }
  const data: unknown = await res.json()
  return parseCartPayload(data)
}

// PATCH /cart/items/:itemId
export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const res = await fetch(`${API_BASE}/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ quantity }),
  })
  if (!res.ok) {
    throw new CartApiError(await parseErrorMessage(res), res.status)
  }
  const data: unknown = await res.json()
  return parseCartPayload(data)
}

// DELETE /cart/items/:itemId
export async function removeCartItem(itemId: string): Promise<Cart> {
  const res = await fetch(`${API_BASE}/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) {
    throw new CartApiError(await parseErrorMessage(res), res.status)
  }
  const data: unknown = await res.json()
  return parseCartPayload(data)
}
