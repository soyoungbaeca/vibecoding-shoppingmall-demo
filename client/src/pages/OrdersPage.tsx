import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { fetchMyOrders, OrderApiError } from '@/api/orders.ts'
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TABS,
  type OrderStatusTabId,
} from '@/constants/orderStatus.ts'
import { useAuth } from '@/contexts/AuthContext.tsx'
import type { Order } from '@/types/order.ts'
import { formatKrw } from '@/lib/productVariantUtils.ts'

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
}

function formatOrderDate(iso?: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const datePart = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${datePart} · ${timePart}`
}

function OrderCardThumbs({ items }: { items: Order['items'] }) {
  const visible = items.slice(0, 3)
  const extraCount = Math.max(0, items.length - visible.length)

  if (items.length === 0) {
    return <span className="orders-card-thumb orders-card-thumb-empty" aria-hidden />
  }

  return (
    <div className="orders-card-thumbs">
      {visible.map((item) => (
        <div key={item.id} className="orders-card-thumb-wrap">
          {item.bottleImage ? (
            <img src={item.bottleImage} alt="" className="orders-card-thumb" />
          ) : (
            <span className="orders-card-thumb orders-card-thumb-empty" />
          )}
          {item.quantity > 1 ? (
            <span className="orders-card-thumb-qty">{item.quantity}</span>
          ) : null}
        </div>
      ))}
      {extraCount > 0 ? (
        <span className="orders-card-thumb-more" aria-label={`${extraCount} more items`}>
          +{extraCount}
        </span>
      ) : null}
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const statusLabel = ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status
  const paymentLabel = PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus
  const summary =
    order.itemsSummary ??
    order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')

  return (
    <article className="orders-card">
      <OrderCardThumbs items={order.items} />

      <div className="orders-card-body">
        <header className="orders-card-head">
          <div>
            <p className="orders-card-number">{order.orderNumber}</p>
            <p className="orders-card-date">{formatOrderDate(order.orderedAt)}</p>
          </div>
          <p className="orders-card-total">{formatKrw(order.amounts.total)}</p>
        </header>

        <p className="orders-card-summary">{summary}</p>

        <div className="orders-card-meta">
          <span className="orders-badge">{statusLabel}</span>
          <span className="orders-badge orders-badge-muted">{paymentLabel}</span>
        </div>
      </div>
    </article>
  )
}

export default function OrdersPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<OrderStatusTabId>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeTabLabel = ORDER_STATUS_TABS.find((tab) => tab.id === activeTab)?.label ?? 'All'

  // 탭·로그인 변경 시 주문 목록 조회
  useEffect(() => {
    if (!isLoggedIn) return

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchMyOrders({
      page: 1,
      limit: 50,
      status: activeTab === 'all' ? undefined : activeTab,
    })
      .then((result) => {
        if (!cancelled) setOrders(result.items)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof OrderApiError ? err.message : '주문 목록을 불러오지 못했습니다.'
          setError(message)
          setOrders([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, activeTab])

  if (authLoading) {
    return (
      <main className="orders-page">
        <p className="orders-status">Loading…</p>
      </main>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/orders' }} />
  }

  return (
    <main className="orders-page">
      <div className="orders-inner">
        <header className="orders-header">
          <h1 className="orders-title">Order history</h1>
          <p className="orders-lead">View and track your recent orders.</p>
        </header>

        <nav className="orders-tabs" aria-label="Filter by order status">
          {ORDER_STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`orders-tab${activeTab === tab.id ? ' orders-tab-active' : ''}`}
              aria-current={activeTab === tab.id ? 'true' : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {loading ? (
          <p className="orders-status" role="status">
            Loading your orders…
          </p>
        ) : null}

        {error ? (
          <p className="orders-error" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && orders.length === 0 ? (
          <div className="orders-empty">
            <p>
              {activeTab === 'all'
                ? "You haven't placed any orders yet."
                : `No ${activeTabLabel.toLowerCase()} orders.`}
            </p>
            <Link to="/#fragrance" className="orders-empty-cta">
              Shop fragrance
            </Link>
          </div>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <ul className="orders-list">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        ) : null}

        <Link to="/" className="orders-back-link">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
