import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { createOrder, OrderApiError } from '@/api/orders.ts'
import { AUTH_TOKEN_KEY, fetchCurrentUser } from '@/api/auth.ts'
import { useAuth } from '@/contexts/AuthContext.tsx'
import { useCart } from '@/contexts/CartContext.tsx'
import { buildShippingAddress, calcCheckoutTotals } from '@/lib/checkoutUtils.ts'
import { PORTONE_PAY_METHOD, PORTONE_PG } from '@/config/portone.ts'
import {
  createPaymentMerchantUid,
  getCheckoutMobileRedirectUrl,
  initPortOne,
  requestPortOnePayment,
} from '@/lib/portone.ts'
import { formatKrw } from '@/lib/productVariantUtils.ts'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const { cart, isLoading: cartLoading } = useCart()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [phone, setPhone] = useState('')
  const [marketingEmail, setMarketingEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portOneReady, setPortOneReady] = useState(false)
  const orderPlacedRef = useRef(false)

  const availableItems = useMemo(
    () => cart.items.filter((item) => item.available),
    [cart.items]
  )

  const totals = useMemo(
    () => calcCheckoutTotals(cart.totals.subtotal),
    [cart.totals.subtotal]
  )

  const hasAddress = address.trim() !== '' && city.trim() !== '' && postalCode.trim() !== ''

  // PortOne(IMP) 결제 모듈 초기화
  useEffect(() => {
    let cancelled = false
    void initPortOne()
      .then(() => {
        if (!cancelled) setPortOneReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : '결제 모듈 초기화에 실패했습니다.'
          setError(message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 로그인 사용자 이메일·이름 프리필
  useEffect(() => {
    if (!isLoggedIn) return
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return

    void fetchCurrentUser(token).then((profile) => {
      setEmail(profile.email)
      const parts = profile.name.trim().split(/\s+/)
      if (parts.length >= 2) {
        setLastName(parts[0] ?? '')
        setFirstName(parts.slice(1).join(' '))
      } else if (parts[0]) {
        setFirstName(parts[0])
      }
      if (profile.address?.trim()) {
        setAddress(profile.address.trim())
      }
    })
  }, [isLoggedIn])

  // 결제(IMP.request_pay) 성공 후 주문 생성
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!portOneReady) {
      setError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    const recipientName = `${lastName.trim()}${firstName.trim() ? ` ${firstName.trim()}` : ''}`.trim()
    if (!recipientName) {
      setError('수령인 이름을 입력해 주세요.')
      return
    }
    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      setError('배송 주소를 모두 입력해 주세요.')
      return
    }

    const shippingAddress = buildShippingAddress({ address, addressLine2, city, postalCode })
    const merchantUid = createPaymentMerchantUid()

    setSubmitting(true)
    try {
      const mobileRedirectUrl = getCheckoutMobileRedirectUrl()
      const payment = await requestPortOnePayment({
        pg: PORTONE_PG,
        pay_method: PORTONE_PAY_METHOD,
        merchant_uid: merchantUid,
        name: `주문명:Lumière`,
        amount: totals.total,
        buyer_email: email.trim() || undefined,
        buyer_name: recipientName,
        buyer_tel: phone.trim() || undefined,
        buyer_addr: shippingAddress,
        buyer_postcode: postalCode.trim(),
        ...(mobileRedirectUrl ? { m_redirect_url: mobileRedirectUrl } : {}),
      })

      if (payment.paid_amount != null && payment.paid_amount !== totals.total) {
        throw new Error('결제 금액이 주문 금액과 일치하지 않습니다.')
      }

      const order = await createOrder({
        shipping: {
          recipientName,
          phone: phone.trim(),
          address: shippingAddress,
        },
        paymentStatus: 'paid',
        note: [
          payment.imp_uid ? `imp_uid:${payment.imp_uid}` : '',
          payment.merchant_uid ? `merchant_uid:${payment.merchant_uid}` : '',
        ]
          .filter(Boolean)
          .join(';'),
      })

      orderPlacedRef.current = true
      const completeParams = new URLSearchParams({
        order: order.orderNumber,
        total: String(order.amounts.total),
      })
      navigate(`/checkout/complete?${completeParams.toString()}`, {
        replace: true,
        state: { order },
      })
    } catch (err) {
      const message =
        err instanceof OrderApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '결제 또는 주문 처리에 실패했습니다.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || cartLoading) {
    return (
      <main className="checkout-page">
        <p className="checkout-status">불러오는 중…</p>
      </main>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />
  }

  if (availableItems.length === 0 && !orderPlacedRef.current) {
    return <Navigate to="/#fragrance" replace />
  }

  return (
    <main className="checkout-page">
      <div className="checkout-layout">
        <div className="checkout-main">
          <Link to="/" className="checkout-brand">
            Lumière.
          </Link>

          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            {error ? (
              <p className="checkout-form-error" role="alert">
                {error}
              </p>
            ) : null}

            <section className="checkout-section">
              <h2 className="checkout-section-title">Contact Information</h2>

              <label className="checkout-field">
                <span className="checkout-field-label">Email</span>
                <input
                  type="email"
                  className="checkout-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="checkout-checkbox">
                <input
                  type="checkbox"
                  checked={marketingEmail}
                  onChange={(e) => setMarketingEmail(e.target.checked)}
                />
                <span>Email me with news and offers</span>
              </label>
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section-title">Delivery</h2>

              <label className="checkout-field">
                <span className="checkout-field-label">Country / Region</span>
                <select className="checkout-input checkout-select" defaultValue="KR" disabled>
                  <option value="KR">South Korea</option>
                </select>
              </label>

              <div className="checkout-field-row">
                <label className="checkout-field">
                  <span className="checkout-field-label">Last name</span>
                  <input
                    type="text"
                    className="checkout-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </label>
                <label className="checkout-field">
                  <span className="checkout-field-label">First name</span>
                  <input
                    type="text"
                    className="checkout-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </label>
              </div>

              <label className="checkout-field">
                <span className="checkout-field-label">Address</span>
                <input
                  type="text"
                  className="checkout-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                  required
                />
              </label>

              <label className="checkout-field">
                <span className="checkout-field-label">Apt / Floor / Suite</span>
                <input
                  type="text"
                  className="checkout-input"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  autoComplete="address-line2"
                />
              </label>

              <div className="checkout-field-row checkout-field-row-3">
                <label className="checkout-field">
                  <span className="checkout-field-label">City</span>
                  <input
                    type="text"
                    className="checkout-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"
                    required
                  />
                </label>
                <label className="checkout-field checkout-field-province">
                  <span className="checkout-field-label">Province</span>
                  <select className="checkout-input checkout-select" defaultValue="" disabled>
                    <option value="">—</option>
                  </select>
                </label>
                <label className="checkout-field">
                  <span className="checkout-field-label">Postal code</span>
                  <input
                    type="text"
                    className="checkout-input"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    autoComplete="postal-code"
                    required
                  />
                </label>
              </div>

              <label className="checkout-field">
                <span className="checkout-field-label">Phone</span>
                <input
                  type="tel"
                  className="checkout-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
            </section>

            <button
              type="submit"
              className="checkout-submit"
              disabled={submitting || !portOneReady}
            >
              {submitting
                ? 'Processing…'
                : portOneReady
                  ? 'Pay & complete order'
                  : 'Loading payment…'}
            </button>
          </form>
        </div>

        <aside className="checkout-summary" aria-label="Order summary">
          <ul className="checkout-summary-items">
            {availableItems.map((item) => (
              <li key={item.id} className="checkout-summary-item">
                <div className="checkout-summary-thumb-wrap">
                  {item.bottleImage ? (
                    <img src={item.bottleImage} alt="" className="checkout-summary-thumb" />
                  ) : (
                    <span className="checkout-summary-thumb checkout-summary-thumb-empty" />
                  )}
                  <span className="checkout-summary-qty">{item.quantity}</span>
                </div>
                <div className="checkout-summary-item-info">
                  <p className="checkout-summary-item-name">{item.name}</p>
                  <p className="checkout-summary-item-meta">{item.label}</p>
                </div>
                <p className="checkout-summary-item-price">
                  {formatKrw(item.lineSubtotal)}
                </p>
              </li>
            ))}
          </ul>

          <div className="checkout-discount">
            <input
              type="text"
              className="checkout-input"
              placeholder="Discount code or gift card"
              disabled
            />
            <button type="button" className="checkout-discount-btn" disabled>
              Apply
            </button>
          </div>

          <div className="checkout-totals">
            <div className="checkout-totals-row">
              <span>Subtotal</span>
              <span>{formatKrw(totals.subtotal)}</span>
            </div>
            <div className="checkout-totals-row">
              <span>Shipping</span>
              <span className={hasAddress ? undefined : 'checkout-muted'}>
                {hasAddress
                  ? totals.shippingFee === 0
                    ? 'Free'
                    : formatKrw(totals.shippingFee)
                  : 'Enter shipping address'}
              </span>
            </div>
            <div className="checkout-totals-row checkout-totals-grand">
              <span>Total</span>
              <span>
                <span className="checkout-currency">KRW</span>{' '}
                <strong>{formatKrw(totals.total)}</strong>
              </span>
            </div>
          </div>

          <div className="checkout-info-box">
            <span className="checkout-info-icon" aria-hidden>
              i
            </span>
            <p>
              The total amount you pay includes all applicable customs duties &amp; taxes. We
              guarantee no additional charges on delivery.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
