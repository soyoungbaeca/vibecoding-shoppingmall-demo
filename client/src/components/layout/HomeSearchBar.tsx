import { useEffect, useId, useRef } from 'react'
import { IconClose } from '@/components/icons/NavIcons.tsx'

type Props = {
  open: boolean
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

export default function HomeSearchBar({ open, value, onChange, onClose }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  // 열릴 때 입력창 포커스
  useEffect(() => {
    if (!open) return
    const tid = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(tid)
  }, [open])

  // Esc로 닫기
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="home-search-panel" role="search">
      <div className="home-search-inner">
        <div className="home-search-field">
          <label className="home-search-label" htmlFor={inputId}>
            Search
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            className="home-search-input"
            placeholder="Search for a question or a keyword"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          className="home-search-close"
          onClick={onClose}
          aria-label="검색 닫기"
        >
          <IconClose />
        </button>
      </div>
    </div>
  )
}
