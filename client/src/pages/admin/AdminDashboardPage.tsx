import { useMemo, useState } from 'react'
import AdminAccessGate from '@/components/admin/AdminAccessGate.tsx'
import { getDashboardSnapshot } from '@/data/mockAdminDashboard.ts'
import type { DashboardPeriod } from '@/types/adminDashboard.ts'

function formatKrw(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('7d')
  const data = useMemo(() => getDashboardSnapshot(period), [period])

  const maxRevenue = Math.max(...data.dailyRevenue.map((d) => d.revenue), 1)
  const todayRevenue = data.dailyRevenue[data.dailyRevenue.length - 1]?.revenue ?? 0

  return (
    <AdminAccessGate>
      <div>
        <p className="admin-demo-note" role="status">
          프론트 데모입니다. 표시되는 매출·주문 데이터는 샘플입니다.
        </p>

        <div className="admin-page-head">
          <div>
            <h1 className="admin-page-title">매출 대시보드</h1>
            <p className="admin-page-lead">쇼핑몰 매출과 주문 추이를 한눈에 확인합니다.</p>
          </div>
          <div className="admin-period-tabs" role="tablist" aria-label="기간">
            <button
              type="button"
              role="tab"
              aria-selected={period === '7d'}
              className={`admin-period-tab${period === '7d' ? ' is-active' : ''}`}
              onClick={() => setPeriod('7d')}
            >
              최근 7일
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={period === '30d'}
              className={`admin-period-tab${period === '30d' ? ' is-active' : ''}`}
              onClick={() => setPeriod('30d')}
            >
              최근 30일
            </button>
          </div>
        </div>

        <div className="admin-stats admin-stats-dashboard">
          <div className="admin-stat-card admin-stat-card-highlight">
            <p className="admin-stat-label">오늘 매출</p>
            <p className="admin-stat-value">{formatKrw(todayRevenue)}</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">기간 총 매출</p>
            <p className="admin-stat-value">{formatKrw(data.totalRevenue)}</p>
            <p
              className={`admin-stat-delta${data.revenueChangePercent >= 0 ? ' is-up' : ' is-down'}`}
            >
              {formatPercent(data.revenueChangePercent)} vs 이전 기간
            </p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">주문 수</p>
            <p className="admin-stat-value">{data.totalOrders}</p>
            <p
              className={`admin-stat-delta${data.ordersChangePercent >= 0 ? ' is-up' : ' is-down'}`}
            >
              {formatPercent(data.ordersChangePercent)} vs 이전 기간
            </p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">평균 주문액</p>
            <p className="admin-stat-value">{formatKrw(data.averageOrderValue)}</p>
          </div>
        </div>

        <div className="admin-dashboard-grid">
          <section className="admin-card admin-chart-card">
            <h2 className="admin-card-title">매출 추이</h2>
            <p className="admin-card-sub">일별 매출 (KRW)</p>
            <div className="admin-bar-chart" role="img" aria-label="일별 매출 막대 차트">
              {data.dailyRevenue.map((day) => (
                <div key={day.date} className="admin-bar-col">
                  <div className="admin-bar-track">
                    <div
                      className="admin-bar-fill"
                      style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="admin-bar-label">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="admin-dashboard-row">
            <section className="admin-card admin-bestseller-card">
              <h2 className="admin-card-title">베스트셀러</h2>
              <p className="admin-card-sub">판매량 기준 TOP 4</p>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">상품</th>
                      <th scope="col">판매 수</th>
                      <th scope="col">매출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td>
                          <span className="admin-rank">{index + 1}</span>
                          {product.name}
                        </td>
                        <td>{product.unitsSold}</td>
                        <td>{formatKrw(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="admin-side-metrics">
              <section className="admin-card admin-summary-card">
                <h2 className="admin-card-title">총 매출</h2>
                <p className="admin-card-sub">누적 매출 (전체 기간)</p>
                <p className="admin-summary-value">
                  {formatKrw(data.cumulativeRevenue)}
                </p>
                <p
                  className={`admin-stat-delta${data.cumulativeRevenueChangePercent >= 0 ? ' is-up' : ' is-down'}`}
                >
                  {formatPercent(data.cumulativeRevenueChangePercent)} vs 지난달
                </p>
              </section>

              <section className="admin-card admin-summary-card">
                <h2 className="admin-card-title">총 고객수</h2>
                <p className="admin-card-sub">가입·구매 고객 합계</p>
                <p className="admin-summary-value">
                  {data.totalCustomers.toLocaleString('ko-KR')}
                </p>
                <p
                  className={`admin-stat-delta${data.totalCustomersChangePercent >= 0 ? ' is-up' : ' is-down'}`}
                >
                  {formatPercent(data.totalCustomersChangePercent)} vs 지난달
                </p>
              </section>
            </div>
          </div>

          <section className="admin-card admin-card-wide">
            <h2 className="admin-card-title">최근 주문</h2>
            <p className="admin-card-sub">최신 결제 완료 주문</p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">주문번호</th>
                    <th scope="col">고객</th>
                    <th scope="col">금액</th>
                    <th scope="col">일시</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="admin-product-name">{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>{formatKrw(order.amount)}</td>
                      <td className="admin-cell-muted">{formatDateTime(order.orderedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AdminAccessGate>
  )
}
