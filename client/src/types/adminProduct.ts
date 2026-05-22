import type { ProductVariant } from '@/types/productVariant.ts'

export type ProductStatus = 'published' | 'draft'

export type AdminProduct = {
  id: string
  name: string
  subtitle: string
  currency: string
  variants: ProductVariant[]
  status: ProductStatus
  moodImage: string
  badgeLabel?: string
  showOnHome: boolean
  updatedAt: string
}

export type AdminProductDraft = Omit<AdminProduct, 'id' | 'updatedAt'>
