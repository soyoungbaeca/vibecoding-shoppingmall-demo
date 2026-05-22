import { API_BASE } from '@/config/env.ts'
import { AUTH_TOKEN_KEY } from '@/constants/authStorage.ts'
import type { AdminProduct, AdminProductDraft } from '@/types/adminProduct.ts'
import type { ProductVariant } from '@/types/productVariant.ts'

export class ProductApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ProductApiError'
    this.status = status
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!token) {
    throw new ProductApiError('로그인이 필요합니다.', 401)
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

function parseVariant(raw: unknown): ProductVariant | null {
  if (typeof raw !== 'object' || raw === null) return null
  const v = raw as Record<string, unknown>
  if (
    typeof v.id !== 'string' ||
    typeof v.sku !== 'string' ||
    typeof v.label !== 'string' ||
    typeof v.price !== 'number' ||
    typeof v.stock !== 'number' ||
    typeof v.bottleImage !== 'string'
  ) {
    return null
  }
  return {
    id: v.id,
    sku: v.sku,
    label: v.label,
    price: v.price,
    stock: v.stock,
    bottleImage: v.bottleImage,
    isDefault: typeof v.isDefault === 'boolean' ? v.isDefault : undefined,
  }
}

// API 응답 → AdminProduct
export function parseAdminProduct(raw: unknown): AdminProduct {
  if (typeof raw !== 'object' || raw === null) {
    throw new ProductApiError('상품 데이터 형식이 올바르지 않습니다.', 500)
  }
  const p = raw as Record<string, unknown>
  if (
    typeof p.id !== 'string' ||
    typeof p.name !== 'string' ||
    typeof p.subtitle !== 'string' ||
    typeof p.currency !== 'string' ||
    typeof p.status !== 'string' ||
    typeof p.moodImage !== 'string' ||
    typeof p.updatedAt !== 'string' ||
    !Array.isArray(p.variants)
  ) {
    throw new ProductApiError('상품 데이터 형식이 올바르지 않습니다.', 500)
  }

  const variants = p.variants
    .map(parseVariant)
    .filter((v): v is ProductVariant => v !== null)

  if (variants.length === 0) {
    throw new ProductApiError('상품 옵션 데이터가 없습니다.', 500)
  }

  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    currency: p.currency,
    status: p.status as AdminProduct['status'],
    moodImage: p.moodImage,
    badgeLabel: typeof p.badgeLabel === 'string' ? p.badgeLabel : undefined,
    showOnHome: p.showOnHome === true,
    variants,
    updatedAt: p.updatedAt,
  }
}

export const HOME_FEATURED_MAX = 4

export const ADMIN_PRODUCTS_PAGE_SIZE = 5

export type AdminProductListStats = {
  total: number
  published: number
  draft: number
  lowStock: number
  homeFeatured: number
}

export type AdminProductListResult = {
  items: AdminProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
  stats: AdminProductListStats
}

// API 본문 — variant.id 제외
export function toProductApiBody(draft: AdminProductDraft) {
  return {
    name: draft.name,
    subtitle: draft.subtitle,
    currency: draft.currency,
    status: draft.status,
    moodImage: draft.moodImage,
    ...(draft.badgeLabel?.trim() ? { badgeLabel: draft.badgeLabel.trim() } : {}),
    variants: draft.variants.map(({ sku, label, price, stock, bottleImage, isDefault }) => ({
      sku,
      label,
      price,
      stock,
      bottleImage,
      isDefault,
    })),
  }
}

// GET /admin/products — 페이지네이션 목록
export async function fetchAdminProducts(params?: {
  status?: string
  q?: string
  page?: number
  limit?: number
}): Promise<AdminProductListResult> {
  const search = new URLSearchParams()
  if (params?.status) search.set('status', params.status)
  if (params?.q?.trim()) search.set('q', params.q.trim())
  if (params?.page != null) search.set('page', String(params.page))
  if (params?.limit != null) search.set('limit', String(params.limit))
  const qs = search.toString()

  const res = await fetch(`${API_BASE}/admin/products${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(),
  })

  if (!res.ok) {
    throw new ProductApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  if (typeof data !== 'object' || data === null || !Array.isArray((data as { items?: unknown }).items)) {
    throw new ProductApiError('상품 목록 형식이 올바르지 않습니다.', 500)
  }

  const body = data as Record<string, unknown>
  const statsRaw = body.stats
  if (
    typeof body.page !== 'number' ||
    typeof body.limit !== 'number' ||
    typeof body.total !== 'number' ||
    typeof body.totalPages !== 'number' ||
    typeof statsRaw !== 'object' ||
    statsRaw === null
  ) {
    throw new ProductApiError('상품 목록 형식이 올바르지 않습니다.', 500)
  }

  const stats = statsRaw as Record<string, unknown>
  if (
    typeof stats.total !== 'number' ||
    typeof stats.published !== 'number' ||
    typeof stats.draft !== 'number' ||
    typeof stats.lowStock !== 'number' ||
    typeof stats.homeFeatured !== 'number'
  ) {
    throw new ProductApiError('상품 통계 형식이 올바르지 않습니다.', 500)
  }

  return {
    items: (body.items as unknown[]).map(parseAdminProduct),
    page: body.page,
    limit: body.limit,
    total: body.total,
    totalPages: body.totalPages,
    stats: {
      total: stats.total,
      published: stats.published,
      draft: stats.draft,
      lowStock: stats.lowStock,
      homeFeatured: stats.homeFeatured,
    },
  }
}

// POST /admin/products
export async function createProduct(draft: AdminProductDraft): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(toProductApiBody(draft)),
  })

  if (!res.ok) {
    throw new ProductApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  return parseAdminProduct(data)
}

// PATCH /admin/products/:id
export async function updateProduct(
  id: string,
  draft: AdminProductDraft
): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(toProductApiBody(draft)),
  })

  if (!res.ok) {
    throw new ProductApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  return parseAdminProduct(data)
}

// PATCH /admin/products/:id — 홈 노출 토글
export async function setProductShowOnHome(
  id: string,
  showOnHome: boolean
): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ showOnHome }),
  })

  if (!res.ok) {
    throw new ProductApiError(await parseErrorMessage(res), res.status)
  }

  const data: unknown = await res.json()
  return parseAdminProduct(data)
}

// DELETE /admin/products/:id
export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (!res.ok) {
    throw new ProductApiError(await parseErrorMessage(res), res.status)
  }
}
