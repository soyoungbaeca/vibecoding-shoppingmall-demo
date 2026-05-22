import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { fetchOrder, OrderApiError } from '@/api/orders.ts'
import { useCart } from '@/contexts/CartContext.tsx'
import type { Order } from '@/types/order.ts'
import { formatKrw } from '@/lib/productVariantUtils.ts'

type CompleteLocationState = {
  order?: Order
}

function CompleteCheckIcon() {
  return (
    <span className="checkout-complete-icon" aria-hidden>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M14 24.5l7 7 13-14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export default function CheckoutCompletePage() {
  const location = useLocation()
  const { refreshCart } = useCart()
  const state = (location.state as CompleteLocationState | null) ?? {}
  const orderNumberFromQuery = new URLSearchParams(location.search).get('order')?.trim() ?? ''

  const [order, setOrder] = useState<Order | null>(state.order ?? null)
  const [loading, setLoading] = useState(!state.order && Boolean(orderNumberFromQuery))
  const [error, setError] = useState<string | null>(null)

  // 완료 페이지 진입 시 장바구니 동기화
  useEffect(() => {
    void refreshCart()
  }, [refreshCart])

  // state 없을 때 주문번호로 조회
  useEffect(() => {
    if (state.order || !orderNumberFromQuery) return

    let cancelled = false
    setLoading(true)
    void fetchOrder(orderNumberFromQuery)
      .then((fetched) => {
        if (!cancelled) setOrder(fetched)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof OrderApiError ? err.message : '주문 정보를 불러오지 못했습니다.'
          setError(message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [state.order, orderNumberFromQuery])

  const displayOrderNumber = order?.orderNumber ?? orderNumberFromQuery

  if (!displayOrderNumber && !loading) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <main className="checkout-complete-page">
        <p className="checkout-complete-status">주문 정보를 불러오는 중…</p>
      </main>
    )
  }

  if (error && !order) {
    return (
      <main className="checkout-complete-page">
        <div className="checkout-complete-inner">
          <p className="checkout-complete-error" role="alert">
            {error}
          </p>
          <Link to="/" className="checkout-complete-cta">
            Continue shopping
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-complete-page">
      <div className="checkout-complete-inner">
        <Link to="/" className="checkout-brand checkout-complete-brand">
          Lumière.
        </Link>

        <div className="checkout-complete-card">
          <CompleteCheckIcon />

          <p className="checkout-complete-eyebrow">Order confirmed</p>
          <h1 className="checkout-complete-title">주문이 완료되었습니다</h1>
          <p className="checkout-complete-subtitle">
            결제가 정상적으로 처리되었습니다.
            {order?.customer.email ? (
              <>
                {' '}
                확인 메일은 <strong>{order.customer.email}</strong> 로 보내 드립니다.
              </>
            ) : (
              ' 주문 확인 메일을 곧 받으실 수 있습니다.'
            )}
          </p>

          <dl className="checkout-complete-summary">
            <div className="checkout-complete-summary-row">
              <dt>주문 번호</dt>
              <dd className="checkout-complete-order-no">{displayOrderNumber}</dd>
            </div>
            {order?.amounts ? (
              <>
                <div className="checkout-complete-summary-row">
                  <dt>상품 소계</dt>
                  <dd>{formatKrw(order.amounts.subtotal)}</dd>
                </div>
                <div className="checkout-complete-summary-row">
                  <dt>배송비</dt>
                  <dd>
                    {order.amounts.shippingFee === 0
                      ? 'Free'
                      : formatKrw(order.amounts.shippingFee)}
                  </dd>
                </div>
                <div className="checkout-complete-summary-row checkout-complete-summary-total">
                  <dt>결제 금액</dt>
                  <dd>{formatKrw(order.amounts.total)}</dd>
                </div>
              </>
            ) : null}
          </dl>

          {order?.items && order.items.length > 0 ? (
            <ul className="checkout-complete-items">
              {order.items.map((item) => (
                <li key={item.id} className="checkout-complete-item">
                  <div className="checkout-complete-item-thumb-wrap">
                    {item.bottleImage ? (
                      <img src={item.bottleImage} alt="" className="checkout-complete-item-thumb" />
                    ) : (
                      <span className="checkout-complete-item-thumb checkout-complete-item-thumb-empty" />
                    )}
                    <span className="checkout-complete-item-qty">{item.quantity}</span>
                  </div>
                  <div className="checkout-complete-item-info">
                    <p className="checkout-complete-item-name">{item.name}</p>
                    <p className="checkout-complete-item-meta">{item.label}</p>
                  </div>
                  <p className="checkout-complete-item-price">{formatKrw(item.lineSubtotal)}</p>
                </li>
              ))}
            </ul>
          ) : null}

          {order?.shipping ? (
            <div className="checkout-complete-shipping">
              <p className="checkout-complete-shipping-title">Delivery</p>
              <p className="checkout-complete-shipping-text">
                {order.shipping.recipientName}
                {order.shipping.phone ? ` · ${order.shipping.phone}` : ''}
              </p>
              <p className="checkout-complete-shipping-text">{order.shipping.address}</p>
            </div>
          ) : null}

          <div className="checkout-complete-actions">
            <Link to="/" className="checkout-complete-cta">
              Continue shopping
            </Link>
            <Link to="/orders" className="checkout-complete-cta-secondary">
              View my orders
            </Link>
          </div>
        </div>

        <p className="checkout-complete-footnote">
          문의가 필요하시면 주문 번호를 함께 알려 주세요.
        </p>
      </div>
    </main>
  )
}
