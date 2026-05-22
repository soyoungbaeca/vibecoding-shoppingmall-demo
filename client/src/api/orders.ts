import { API_BASE } from '@/config/env.ts'
import { AUTH_TOKEN_KEY } from '@/constants/authStorage.ts'
import type { Order } from '@/types/order.ts'

export class OrderApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'OrderApiError'
    this.status = status
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) {
    throw new OrderApiError('로그인이 필요합니다.', 401)
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

function parseOrderPayload(data: unknown): Order {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as { order?: unknown }).order !== 'object' ||
    (data as { order: unknown }).order === null
  ) {
    throw new OrderApiError('주문 데이터 형식이 올바르지 않습니다.', 500)
  }
  return (data as { order: Order }).order
}

export type CreateOrderBody = {
  shipping: {
    recipientName: string
    phone: string
    address: string
  }
  note?: string
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded'
}

// POST /orders — 장바구니 체크아웃
export async function createOrder(body: CreateOrderBody): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new OrderApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  return parseOrderPayload(data)
}

// GET /orders/:id — 주문번호 또는 id로 단건 조회
export async function fetchOrder(orderIdOrNumber: string): Promise<Order> {
  const encoded = encodeURIComponent(orderIdOrNumber.trim())
  const res = await fetch(`${API_BASE}/orders/${encoded}`, {
    method: 'GET',
    headers: authHeaders(),
  })

  if (!res.ok) {
    throw new OrderApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  return parseOrderPayload(data)
}

export type OrderListResult = {
  items: Order[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type FetchMyOrdersOptions = {
  page?: number
  limit?: number
  status?: string
}

// GET /orders — 내 주문 목록 (status로 필터)
export async function fetchMyOrders(
  pageOrOptions: number | FetchMyOrdersOptions = 1,
  limit = 20,
  status?: string
): Promise<OrderListResult> {
  const options =
    typeof pageOrOptions === 'object'
      ? pageOrOptions
      : { page: pageOrOptions, limit, status }

  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  })
  if (options.status?.trim()) {
    params.set('status', options.status.trim())
  }
  const res = await fetch(`${API_BASE}/orders?${params.toString()}`, {
    method: 'GET',
    headers: authHeaders(),
  })

  if (!res.ok) {
    throw new OrderApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  if (typeof data !== 'object' || data === null) {
    throw new OrderApiError('주문 목록 형식이 올바르지 않습니다.', 500)
  }

  const payload = data as {
    items?: unknown
    page?: unknown
    limit?: unknown
    total?: unknown
    totalPages?: unknown
  }

  if (!Array.isArray(payload.items)) {
    throw new OrderApiError('주문 목록 형식이 올바르지 않습니다.', 500)
  }

  return {
    items: payload.items as Order[],
    page: Number(payload.page) || 1,
    limit: Number(payload.limit) || limit,
    total: Number(payload.total) || 0,
    totalPages: Number(payload.totalPages) || 1,
  }
}
