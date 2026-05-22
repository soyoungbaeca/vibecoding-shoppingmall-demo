import type { Order } from '@/types/order.ts'
import type { AdminShipment } from '@/types/adminShipment.ts'

// Order API 응답 → 어드민 배송 목록 행
export function orderToAdminShipment(order: Order): AdminShipment {
  const itemsSummary =
    order.itemsSummary ??
    order.items.map((item) => `${item.name} ${item.label} × ${item.quantity}`).join(', ')

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    email: order.customer.email,
    address: order.shipping.address,
    itemsSummary,
    status: order.status as AdminShipment['status'],
    carrier: order.shippingInfo?.carrier ?? '',
    trackingNumber: order.shippingInfo?.trackingNumber ?? '',
    orderedAt: order.orderedAt ?? '',
    updatedAt: order.updatedAt ?? order.orderedAt ?? '',
  }
}
