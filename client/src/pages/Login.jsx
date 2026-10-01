import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value })
    setFieldError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || !values.password) {
      setFieldError('Enter a valid email address and password.')
      return
    }

    setError('')
    setFieldError('')
    setSubmitting(true)
    try {
      await login({ email: values.email.trim(), password: values.password })
      navigate(location.state?.from ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}` : '/', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container page-section auth-page">
      <div className="page-heading">
        <p className="eyebrow">Welcome back</p>
        <h1>Log in</h1>
        <p>Sign in to continue with NEXORA.</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label>Email address<input autoComplete="email" name="email" type="email" value={values.email} onChange={handleChange} required /></label>
        <label>Password<input autoComplete="current-password" name="password" type="password" value={values.password} onChange={handleChange} required /></label>
        {(fieldError || error) && <p className="form-error" role="alert">{fieldError || error}</p>}
        <button className="button" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Log in'}</button>
        <p className="auth-switch">New to NEXORA? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  )
}

export default Login