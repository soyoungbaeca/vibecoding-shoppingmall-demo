export const FREE_SHIPPING_THRESHOLD = 60_000
export const DEFAULT_SHIPPING_FEE = 3_000

export function calcShippingFee(subtotal: number): number {
  const amount = Number(subtotal) || 0
  if (amount >= FREE_SHIPPING_THRESHOLD) return 0
  return DEFAULT_SHIPPING_FEE
}

export function calcCheckoutTotals(subtotal: number) {
  const sub = Math.max(0, Number(subtotal) || 0)
  const shippingFee = calcShippingFee(sub)
  return {
    subtotal: sub,
    shippingFee,
    total: sub + shippingFee,
  }
}

// 폼 필드 → API 배송 주소 문자열
export function buildShippingAddress(fields: {
  address: string
  addressLine2?: string
  city: string
  postalCode: string
}): string {
  const parts = [
    fields.address.trim(),
    fields.addressLine2?.trim(),
    `${fields.city.trim()} ${fields.postalCode.trim()}`.trim(),
    '대한민국',
  ].filter(Boolean)
  return parts.join(', ')
}
