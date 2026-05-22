import { useEffect, useState } from 'react'
import { API_BASE } from '@/config/env.ts'

export function BackendStatus() {
  const [label, setLabel] = useState('확인 중…')

  useEffect(() => {
    const ac = new AbortController()
    fetch(`${API_BASE}/health`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json() as Promise<{ ok?: boolean }>
      })
      .then((data) => {
        setLabel(data.ok === true ? '연결됨' : `응답: ${JSON.stringify(data)}`)
      })
      .catch(() => setLabel('연결 안 됨 (서버·MongoDB 확인)'))

    return () => ac.abort()
  }, [])

  return (
    <p className="backend-status">
      백엔드 <code>{API_BASE}/health</code>: {label}
    </p>
  )
}
