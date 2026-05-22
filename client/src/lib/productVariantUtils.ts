import type { ProductVariant } from '@/types/productVariant.ts'

export function formatKrw(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

export function formatPrice(amount: number, currency: string): string {
  if (currency === 'KRW') return formatKrw(amount)
  return `${currency} ${amount.toLocaleString()}`
}

// 기본 옵션 (없으면 첫 항목)
export function getDefaultVariant(variants: ProductVariant[]): ProductVariant {
  return variants.find((v) => v.isDefault) ?? variants[0]
}

export function productTotalStock(variants: ProductVariant[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0)
}

// 목록·카드용 가격 문자열 (단일 / 구간)
export function formatProductPriceLabel(
  variants: ProductVariant[],
  currency: string
): string {
  if (variants.length === 0) return formatPrice(0, currency)
  const prices = variants.map((v) => v.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return formatPrice(min, currency)
  return `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`
}

export function variantLabels(variants: ProductVariant[]): string[] {
  return variants.map((v) => v.label)
}

export function createVariantId(): string {
  return `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// 새 옵션 행 기본값
export function createEmptyVariant(overrides?: Partial<ProductVariant>): ProductVariant {
  return {
    id: createVariantId(),
    sku: '',
    label: '',
    price: 0,
    stock: 0,
    bottleImage: '',
    ...overrides,
  }
}

// 제출 전 옵션 정리·기본 옵션 보장
export function normalizeVariants(raw: ProductVariant[]): ProductVariant[] {
  const trimmed = raw
    .map((v) => ({
      ...v,
      sku: v.sku.trim().toUpperCase(),
      label: v.label.trim(),
      bottleImage: v.bottleImage.trim(),
    }))
    .filter((v) => v.label.length > 0)

  if (trimmed.length === 0) return []

  const hasDefault = trimmed.some((v) => v.isDefault)
  return trimmed.map((v, i) => ({
    ...v,
    isDefault: hasDefault ? Boolean(v.isDefault) : i === 0,
  }))
}

// 단일 SKU 모드인지 (라벨이 단품이거나 옵션이 1개)
export function isSingleSkuProduct(variants: ProductVariant[]): boolean {
  return variants.length === 1 && variants[0].label === '단품'
}

// 상품·옵션 SKU 검색 매칭
export function productMatchesQuery(
  product: { id: string; name: string; subtitle: string; variants: ProductVariant[] },
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (product.name.toLowerCase().includes(q)) return true
  if (product.subtitle.toLowerCase().includes(q)) return true
  if (product.id.toLowerCase().includes(q)) return true
  return product.variants.some(
    (v) => v.sku.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
  )
}
