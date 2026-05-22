export type CartLine = {
  id: string
  productSlug: string
  variantId: string
  sku: string
  quantity: number
  available: boolean
  unavailableReason: string | null
  name: string | null
  subtitle: string | null
  label: string | null
  price: number
  currency: string
  bottleImage: string
  stock: number
  lineSubtotal: number
}

export type CartTotals = {
  subtotal: number
  itemCount: number
  lineCount: number
}

export type Cart = {
  id: string
  userId: string
  items: CartLine[]
  totals: CartTotals
  updatedAt?: string
}
