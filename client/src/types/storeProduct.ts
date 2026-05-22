import type { ProductVariant } from '@/types/productVariant.ts'

export type StoreProduct = {
  id: string
  name: string
  subtitle: string
  variants: ProductVariant[]
  moodImage: string
  badgeLabel?: string
}
