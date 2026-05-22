export type OrderItem = {
  id: string
  productSlug: string
  variantId: string
  sku: string
  name: string
  subtitle: string
  label: string
  unitPrice: number
  quantity: number
  lineSubtotal: number
  bottleImage: string
}

export type OrderAmounts = {
  currency: string
  subtotal: number
  shippingFee: number
  discount: number
  tax: number
  total: number
}

export type Order = {
  id: string
  orderNumber: string
  userId: string
  status: string
  paymentStatus: string
  items: OrderItem[]
  itemsSummary?: string
  shipping: {
    recipientName: string
    phone: string
    address: string
  }
  customer: {
    name: string
    email: string
  }
  amounts: OrderAmounts
  shippingInfo: {
    carrier: string
    trackingNumber: string
  }
  note?: string
  orderedAt?: string
  updatedAt?: string
}
