import type { DashboardPeriod, DashboardSnapshot } from '@/types/adminDashboard.ts'

const DAILY_7D = [
  { date: '2026-05-11', label: '5/11', revenue: 428000, orders: 3 },
  { date: '2026-05-12', label: '5/12', revenue: 296000, orders: 2 },
  { date: '2026-05-13', label: '5/13', revenue: 592000, orders: 4 },
  { date: '2026-05-14', label: '5/14', revenue: 148000, orders: 1 },
  { date: '2026-05-15', label: '5/15', revenue: 444000, orders: 3 },
  { date: '2026-05-16', label: '5/16', revenue: 750000, orders: 5 },
  { date: '2026-05-17', label: '5/17', revenue: 534000, orders: 4 },
]

const DAILY_30D = [
  ...DAILY_7D,
  { date: '2026-05-10', label: '5/10', revenue: 312000, orders: 2 },
  { date: '2026-05-09', label: '5/9', revenue: 468000, orders: 3 },
  { date: '2026-05-08', label: '5/8', revenue: 186000, orders: 1 },
  { date: '2026-05-07', label: '5/7', revenue: 620000, orders: 4 },
  { date: '2026-05-06', label: '5/6', revenue: 274000, orders: 2 },
  { date: '2026-05-05', label: '5/5', revenue: 398000, orders: 3 },
  { date: '2026-05-04', label: '5/4', revenue: 512000, orders: 4 },
]

const TOP_PRODUCTS = [
  { id: 'you', name: 'Lumière You', unitsSold: 48, revenue: 7104000 },
  { id: 'soie', name: 'Lumière Soie', unitsSold: 31, revenue: 4898000 },
  { id: 'doux', name: 'Lumière Doux', unitsSold: 27, revenue: 3996000 },
  { id: 'fleur', name: 'Lumière Fleur', unitsSold: 22, revenue: 3256000 },
]

const RECENT_ORDERS = [
  {
    id: 'o1',
    orderNumber: 'LM-20260517-001',
    customerName: '김소영',
    amount: 148000,
    orderedAt: '2026-05-17T09:12:00.000Z',
  },
  {
    id: 'o2',
    orderNumber: 'LM-20260516-042',
    customerName: '이준호',
    amount: 306000,
    orderedAt: '2026-05-16T14:30:00.000Z',
  },
  {
    id: 'o3',
    orderNumber: 'LM-20260516-038',
    customerName: '박민지',
    amount: 296000,
    orderedAt: '2026-05-16T11:20:00.000Z',
  },
  {
    id: 'o4',
    orderNumber: 'LM-20260515-021',
    customerName: '최예린',
    amount: 148000,
    orderedAt: '2026-05-15T18:22:00.000Z',
  },
  {
    id: 'o5',
    orderNumber: 'LM-20260515-018',
    customerName: '정하은',
    amount: 158000,
    orderedAt: '2026-05-15T16:05:00.000Z',
  },
]

function sumRevenue(days: typeof DAILY_7D) {
  return days.reduce((acc, d) => acc + d.revenue, 0)
}

function sumOrders(days: typeof DAILY_7D) {
  return days.reduce((acc, d) => acc + d.orders, 0)
}

// 기간별 매출 스냅샷 (목 데이터)
export function getDashboardSnapshot(period: DashboardPeriod): DashboardSnapshot {
  const daily = period === '7d' ? DAILY_7D : DAILY_30D.slice(-14)
  const totalRevenue = sumRevenue(daily)
  const totalOrders = sumOrders(daily)
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  return {
    period,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    revenueChangePercent: period === '7d' ? 12.4 : 8.2,
    ordersChangePercent: period === '7d' ? 6.1 : 4.5,
    cumulativeRevenue: 24_580_000,
    cumulativeRevenueChangePercent: period === '7d' ? 18.6 : 15.2,
    totalCustomers: 1284,
    totalCustomersChangePercent: period === '7d' ? 9.3 : 7.8,
    dailyRevenue: daily,
    topProducts: TOP_PRODUCTS,
    recentOrders: RECENT_ORDERS,
  }
}
