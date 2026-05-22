export type DashboardPeriod = '7d' | '30d'

export type DailyRevenue = {
  date: string
  label: string
  revenue: number
  orders: number
}

export type TopProduct = {
  id: string
  name: string
  unitsSold: number
  revenue: number
}

export type RecentOrder = {
  id: string
  orderNumber: string
  customerName: string
  amount: number
  orderedAt: string
}

export type DashboardSnapshot = {
  period: DashboardPeriod
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  revenueChangePercent: number
  ordersChangePercent: number
  /** 누적 총 매출 */
  cumulativeRevenue: number
  cumulativeRevenueChangePercent: number
  /** 누적 고객 수 */
  totalCustomers: number
  totalCustomersChangePercent: number
  dailyRevenue: DailyRevenue[]
  topProducts: TopProduct[]
  recentOrders: RecentOrder[]
}
