import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext.tsx'

type Props = {
  children: ReactNode
}

export default function AdminAccessGate({ children }: Props) {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return <p className="admin-empty">권한 확인 중…</p>
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <h1>접근 권한이 없습니다</h1>
        <p>어드민 계정으로 로그인한 뒤 다시 시도해 주세요.</p>
        <Link to="/" className="admin-btn admin-btn-ghost">
          홈으로
        </Link>
      </div>
    )
  }

  return children
}
