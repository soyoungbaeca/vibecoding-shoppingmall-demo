import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPerson, IconSearch } from '@/components/icons/NavIcons.tsx'
import HomeSearchBar from '@/components/layout/HomeSearchBar.tsx'
import WelcomeMenu from '@/components/layout/WelcomeMenu.tsx'
import { useAuth } from '@/contexts/AuthContext.tsx'
import { useCart } from '@/contexts/CartContext.tsx'

export default function SiteHeader() {
  const { isLoggedIn, isAdmin } = useAuth()
  const { bagCount, openDrawer } = useCart()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  function closeSearch() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  function toggleSearch() {
    setSearchOpen((open) => {
      if (open) setSearchQuery('')
      return !open
    })
  }

  return (
    <header className="home-header">
      <nav className="home-nav" aria-label="메인">
        <div className="home-nav-left">
          <Link to="/" className="home-brand">
            Lumière.
          </Link>
        </div>

        <div className="home-nav-right">
          <button
            type="button"
            className="home-nav-icon-btn"
            aria-label="검색"
            aria-expanded={searchOpen}
            onClick={toggleSearch}
          >
            <IconSearch />
          </button>
          <span className="home-nav-meta">KR</span>
          <a className="home-nav-link" href="#stores">
            STORES
          </a>
          {isLoggedIn ? (
            <WelcomeMenu />
          ) : (
            <Link to="/login" className="home-nav-login">
              <IconPerson />
              <span>LOG IN</span>
            </Link>
          )}
          {isAdmin ? (
            <Link to="/admin/products" className="home-nav-link">
              ADMIN
            </Link>
          ) : null}
          <button
            type="button"
            className="home-nav-link home-bag-btn"
            onClick={openDrawer}
            aria-haspopup="dialog"
          >
            BAG ({bagCount})
          </button>
        </div>
      </nav>

      <HomeSearchBar
        open={searchOpen}
        value={searchQuery}
        onChange={setSearchQuery}
        onClose={closeSearch}
      />
    </header>
  )
}
