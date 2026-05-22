import { Link, NavLink, Outlet } from 'react-router-dom'
import '@/admin.styles.css'

const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'DASHBOARD' },
  { to: '/admin/products', label: 'PRODUCTS' },
  { to: '/admin/shipping', label: 'SHIPPING' },
] as const

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/admin/products" className="admin-brand">
            Lumière.
          </Link>
          <nav className="admin-topnav" aria-label="어드민">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `admin-topnav-link${isActive ? ' is-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/" className="admin-store-link">
            스토어 보기
          </Link>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
