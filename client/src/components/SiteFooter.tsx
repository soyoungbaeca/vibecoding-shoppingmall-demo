import { type FormEvent, useState } from 'react'

const HELP_LINKS = [
  { label: 'Contact', href: '#contact' },
  { label: 'Returns & exchanges', href: '#' },
  { label: 'Help & FAQ', href: '#' },
  { label: 'International', href: '#' },
  { label: 'Responsible disclosure', href: '#' },
] as const

const ABOUT_LINKS = [
  { label: 'About Us', href: '#about' },
  { label: 'Careers', href: '#' },
  { label: 'Journal', href: '#' },
  { label: 'Events', href: '#' },
  { label: 'Lumière for Good', href: '#' },
  { label: 'Membership', href: '/signup' },
] as const

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#' },
  { label: 'Pinterest', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'Youtube', href: '#' },
  { label: 'TikTok', href: '#' },
] as const

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use', href: '#' },
  { label: 'Accessibility', href: '#' },
  { label: 'Cookie Preferences', href: '#' },
] as const

function FooterSmiley() {
  return (
    <svg className="home-footer-deco" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="28" r="2.5" fill="currentColor" />
      <circle cx="40" cy="28" r="2.5" fill="currentColor" />
      <path
        d="M22 40c4 5 16 5 20 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FooterWave() {
  return (
    <svg className="home-footer-deco" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M12 44c8-12 16-18 28-18 6 0 12 2 16 6M44 20l8-6M44 20l2 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 50c6-4 14-6 22-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SiteFooter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  // 뉴스레터 제출 (데모: UI 피드백만)
  function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-top">
          <p className="home-footer-about">
            At Lumière, we make products inspired by real life. Our fragrances
            are designed to live with you — on skin, on fabric, and in memory.
          </p>

          <div className="home-footer-newsletter">
            <form className="home-footer-form" onSubmit={handleSubscribe}>
              <div className="home-footer-form-row">
                <input
                  type="email"
                  className="home-footer-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="이메일 주소"
                  required
                />
                <button type="submit" className="home-footer-submit">
                  Submit
                </button>
              </div>
            </form>
            {subscribed ? (
              <p className="home-footer-form-note home-footer-form-note-success">
                구독해 주셔서 감사합니다.
              </p>
            ) : (
              <p className="home-footer-form-note">
                You can unsubscribe anytime. For more details, review our{' '}
                <a href="#">Privacy Policy</a>.
              </p>
            )}
          </div>
        </div>

        <div className="home-footer-columns">
          <div className="home-footer-col">
            <h3 className="home-footer-col-title">How can we help?</h3>
            <ul className="home-footer-links">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="home-footer-col">
            <h3 className="home-footer-col-title">About Lumière</h3>
            <ul className="home-footer-links">
              {ABOUT_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="home-footer-col">
            <h3 className="home-footer-col-title">Stores</h3>
            <ul className="home-footer-links">
              <li>
                <a href="#stores">Find your store</a>
              </li>
            </ul>
          </div>

          <div className="home-footer-col">
            <h3 className="home-footer-col-title">Social</h3>
            <ul className="home-footer-links">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="home-footer-bottom">
          <div className="home-footer-legal">
            <span className="home-footer-copy">
              © {new Date().getFullYear()} Lumière. All rights reserved.
            </span>
            {LEGAL_LINKS.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <div className="home-footer-decos">
            <FooterSmiley />
            <FooterWave />
          </div>
        </div>
      </div>
    </footer>
  )
}
