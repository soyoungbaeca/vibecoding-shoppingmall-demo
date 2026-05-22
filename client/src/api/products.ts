import { API_BASE } from '@/config/env.ts'
import type { FragranceProduct } from '@/data/fragrances.ts'
import type { StoreProduct } from '@/types/storeProduct.ts'
import type { ProductVariant } from '@/types/productVariant.ts'

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

// API 응답 → StoreProduct
export function parseStoreProduct(raw: unknown): StoreProduct | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  if (
    typeof p.id !== 'string' ||
    typeof p.name !== 'string' ||
    typeof p.subtitle !== 'string' ||
    typeof p.moodImage !== 'string' ||
    !Array.isArray(p.variants)
  ) {
    return null
  }

  const variants = p.variants.map(parseVariant).filter((v): v is ProductVariant => v !== null)
  if (variants.length === 0) return null

  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    variants,
    moodImage: p.moodImage,
    badgeLabel: typeof p.badgeLabel === 'string' ? p.badgeLabel : undefined,
  }
}

// API 상품 → FragranceCard용 형태
export function toFragranceProduct(product: StoreProduct): FragranceProduct {
  return {
    id: product.id,
    name: product.name,
    subtitle: product.subtitle,
    variants: product.variants,
    moodImage: product.moodImage,
    bottleAlt: `${product.name} 향수병`,
    moodAlt: `${product.name} 무드 이미지`,
    ...(product.badgeLabel?.trim()
      ? { badge: { kind: 'tag' as const, label: product.badgeLabel.trim() } }
      : {}),
  }
}

// GET /products/:id — 게시된 상품 단건
export async function fetchProductById(id: string): Promise<FragranceProduct | null> {
  const slug = id.trim().toLowerCase()
  if (!slug) return null

  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
  })

  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error('상품을 불러오지 못했습니다.')
  }

  const data: unknown = await res.json()
  const product = parseStoreProduct(data)
  return product ? toFragranceProduct(product) : null
}

// GET /products?home=1 — 홈 그리드 노출 상품 (최대 4)
export async function fetchHomeProducts(): Promise<FragranceProduct[]> {
  const res = await fetch(`${API_BASE}/products?home=1`, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error('홈 상품을 불러오지 못했습니다.')
  }

  const data: unknown = await res.json()
  if (!Array.isArray(data)) return []

  return data
    .map(parseStoreProduct)
    .filter((p): p is StoreProduct => p !== null)
    .map(toFragranceProduct)
}
