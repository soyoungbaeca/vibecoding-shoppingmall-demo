import { API_BASE } from '@/config/env.ts'
import { AUTH_TOKEN_KEY } from '@/constants/authStorage.ts'
import type { Order } from '@/types/order.ts'
import type { ShipmentStatus } from '@/types/adminShipment.ts'

export class AdminOrderApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminOrderApiError'
    this.status = status
  }
}

export type AdminOrderListResult = {
  items: Order[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type FetchAdminOrdersOptions = {
  page?: number
  limit?: number
  status?: ShipmentStatus | 'all'
  q?: string
}

export type UpdateAdminOrderBody = {
  status?: ShipmentStatus
  shippingInfo?: {
    carrier?: string
    trackingNumber?: string
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) {
    throw new AdminOrderApiError('로그인이 필요합니다.', 401)
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

function parseOrderListPayload(data: unknown): AdminOrderListResult {
  if (typeof data !== 'object' || data === null) {
    throw new AdminOrderApiError('주문 목록 형식이 올바르지 않습니다.', 500)
  }
  const payload = data as {
    items?: unknown
    page?: unknown
    limit?: unknown
    total?: unknown
    totalPages?: unknown
  }
  if (!Array.isArray(payload.items)) {
    throw new AdminOrderApiError('주문 목록 형식이 올바르지 않습니다.', 500)
  }
  return {
    items: payload.items as Order[],
    page: Number(payload.page) || 1,
    limit: Number(payload.limit) || 20,
    total: Number(payload.total) || 0,
    totalPages: Number(payload.totalPages) || 1,
  }
}

function parseOrderPayload(data: unknown): Order {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as { order?: unknown }).order !== 'object' ||
    (data as { order: unknown }).order === null
  ) {
    throw new AdminOrderApiError('주문 데이터 형식이 올바르지 않습니다.', 500)
  }
  return (data as { order: Order }).order
}

// GET /admin/orders — 어드민 주문·배송 목록
export async function fetchAdminOrders(
  options: FetchAdminOrdersOptions = {}
): Promise<AdminOrderListResult> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 50),
  })
  if (options.status && options.status !== 'all') {
    params.set('status', options.status)
  }
  const q = options.q?.trim()
  if (q) params.set('q', q)

  const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
    method: 'GET',
    headers: authHeaders(),
  })

  if (!res.ok) {
    throw new AdminOrderApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  return parseOrderListPayload(data)
}

// PATCH /admin/orders/:id — 배송·주문 상태 수정
export async function updateAdminOrder(
  orderId: string,
  body: UpdateAdminOrderBody
): Promise<Order> {
  const res = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new AdminOrderApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  return parseOrderPayload(data)
}
