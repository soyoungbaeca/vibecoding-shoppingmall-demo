import { Outlet, useLocation } from 'react-router-dom'
import CartDrawer from '@/components/cart/CartDrawer.tsx'
import LoginToast from '@/components/layout/LoginToast.tsx'
import PromoBar from '@/components/layout/PromoBar.tsx'
import SiteFooter from '@/components/SiteFooter.tsx'
import SiteHeader from '@/components/layout/SiteHeader.tsx'
import { CartProvider } from '@/contexts/CartContext.tsx'
import { useLoginToast } from '@/hooks/useLoginToast.ts'

export default function MainLayout() {
  const { pathname } = useLocation()
  const loginToast = useLoginToast()
  const showFooter = pathname === '/' || pathname.startsWith('/products/')
  const isCheckout = pathname.startsWith('/checkout')

  return (
    <CartProvider>
      <div className="home-page">
        {!isCheckout && loginToast ? <LoginToast message={loginToast} /> : null}
        {!isCheckout ? <PromoBar /> : null}
        {!isCheckout ? <SiteHeader /> : null}
        <Outlet />
        {showFooter ? <SiteFooter /> : null}
        <CartDrawer />
      </div>
    </CartProvider>
  )
}
