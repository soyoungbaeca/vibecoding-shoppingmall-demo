import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider } from '@/contexts/AuthContext.tsx'
import AdminLayout from '@/layouts/AdminLayout.tsx'
import MainLayout from '@/layouts/MainLayout.tsx'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage.tsx'
import AdminProductsPage from '@/pages/admin/AdminProductsPage.tsx'
import AdminShippingPage from '@/pages/admin/AdminShippingPage.tsx'
import HomePage from '@/pages/HomePage.tsx'
import LoginPage from '@/pages/LoginPage.tsx'
import CheckoutCompletePage from '@/pages/CheckoutCompletePage.tsx'
import CheckoutPage from '@/pages/CheckoutPage.tsx'
import OrdersPage from '@/pages/OrdersPage.tsx'
import ProductDetailPage from '@/pages/ProductDetailPage.tsx'
import SignupPage from '@/pages/SignupPage.tsx'

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/complete" element={<CheckoutCompletePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/shipping" element={<AdminShippingPage />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  )
}
