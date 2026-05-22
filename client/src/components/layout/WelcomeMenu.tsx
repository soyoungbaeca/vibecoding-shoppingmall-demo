import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext.tsx'

export default function WelcomeMenu() {
  const { displayName, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // WELCOME 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return

    function onDocumentClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [open])

  function closeMenu() {
    setOpen(false)
  }

  function handleLogout() {
    logout()
    setOpen(false)
  }

  return (
    <div className="home-welcome-wrap" ref={menuRef}>
      <button
        type="button"
        className="home-welcome-btn"
        aria-expanded={open}
        aria-haspopup="true"
        title={displayName ? `WELCOME "${displayName}"` : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="home-welcome-prefix">WELCOME &ldquo;</span>
        <span className="home-welcome-name">{displayName}</span>
        <span className="home-welcome-suffix">&rdquo;</span>
      </button>
      {open ? (
        <div className="home-welcome-dropdown" role="menu">
          <Link
            to="/orders"
            className="home-welcome-dropdown-item home-welcome-dropdown-link"
            role="menuitem"
            onClick={closeMenu}
          >
            MY ORDERS
          </Link>
          <button
            type="button"
            className="home-welcome-dropdown-item"
            role="menuitem"
            onClick={handleLogout}
          >
            LOGOUT
          </button>
        </div>
      ) : null}
    </div>
  )
}
