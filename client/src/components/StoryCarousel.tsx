import { useState } from 'react'
import { STORY_SLIDES } from '@/data/stories.ts'

function IconChevronLeft() {
  return (
    <svg className="home-stories-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg className="home-stories-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function StoryCarousel() {
  const total = STORY_SLIDES.length
  const [index, setIndex] = useState(0)
  const slide = STORY_SLIDES[index]
  const indexLabel = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  // 이전·다음 슬라이드 인덱스 순환
  function goPrev() {
    setIndex((i) => (i - 1 + total) % total)
  }

  function goNext() {
    setIndex((i) => (i + 1) % total)
  }

  return (
    <section className="home-stories" aria-label="스토리">
      <div className="home-stories-grid">
        <div className="home-stories-copy">
          <h2 className="home-stories-headline">{slide.headline}</h2>
          <a className="home-stories-cta" href="#stories">
            Read stories
          </a>
          <p className="home-stories-index" aria-live="polite">
            {indexLabel}
          </p>
          <p className="home-stories-body">{slide.body}</p>
          <div className="home-stories-nav">
            <button
              type="button"
              className="home-stories-nav-btn"
              aria-label="이전 스토리"
              onClick={goPrev}
            >
              <IconChevronLeft />
            </button>
            <button
              type="button"
              className="home-stories-nav-btn"
              aria-label="다음 스토리"
              onClick={goNext}
            >
              <IconChevronRight />
            </button>
          </div>
        </div>

        <div className="home-stories-media">
          <img
            key={slide.id}
            className="home-stories-image"
            src={slide.image}
            alt={slide.imageAlt}
          />
          <p className="home-stories-overlay">{slide.overlay}</p>
          <div className="home-stories-media-controls" aria-hidden>
            <button type="button" className="home-stories-media-btn" tabIndex={-1}>
              ♪
            </button>
            <button type="button" className="home-stories-media-btn" tabIndex={-1}>
              ❚❚
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
