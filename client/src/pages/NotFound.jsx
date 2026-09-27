import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="container page-section empty-state">
      <p className="eyebrow">404 / Page not found</p>
      <h1>That page has moved on.</h1>
      <p>Let&apos;s get you back to the useful things.</p>
      <Link className="button" to="/">Return home</Link>
    </section>
  )
}

export default NotFound
