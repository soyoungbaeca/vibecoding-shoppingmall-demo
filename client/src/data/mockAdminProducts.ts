import { FRAGRANCE_PRODUCTS } from '@/data/fragrances.ts'
import type { AdminProduct } from '@/types/adminProduct.ts'

// 홈 향수 데이터를 어드민 목록 초기값으로 변환
export const INITIAL_ADMIN_PRODUCTS: AdminProduct[] = FRAGRANCE_PRODUCTS.map((p, i) => ({
  id: p.id,
  name: p.name,
  subtitle: p.subtitle,
  currency: 'KRW',
  variants: p.variants.map((v, vi) => ({
    ...v,
    stock: Math.max(10, 120 - i * 15 - vi * 8),
  })),
  status: 'published' as const,
  showOnHome: i < 4,
  moodImage: p.moodImage,
  badgeLabel:
    p.badge?.kind === 'tag'
      ? p.badge.label
      : p.badge?.kind === 'ribbon'
        ? p.badge.label
        : undefined,
  updatedAt: new Date(2026, 4, 10 + i).toISOString(),
}))
