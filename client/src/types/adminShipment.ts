export type ShipmentStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type AdminShipment = {
  id: string
  orderNumber: string
  customerName: string
  email: string
  address: string
  itemsSummary: string
  status: ShipmentStatus
  carrier: string
  trackingNumber: string
  orderedAt: string
  updatedAt: string
}
