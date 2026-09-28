import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
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
    if (!values.name.trim()) {
      setFieldError('Enter your name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setFieldError('Enter a valid email address.')
      return
    }
    if (values.password.length < 6) {
      setFieldError('Password must be at least 6 characters.')
      return
    }
    if (values.password !== values.confirmPassword) {
      setFieldError('Passwords do not match.')
      return
    }

    setError('')
    setFieldError('')
    setSubmitting(true)
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password })
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container page-section auth-page">
      <div className="page-heading">
        <p className="eyebrow">Join NEXORA</p>
        <h1>Create account</h1>
        <p>A few details, then you are ready to go.</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label>Name<input autoComplete="name" name="name" value={values.name} onChange={handleChange} required /></label>
        <label>Email address<input autoComplete="email" name="email" type="email" value={values.email} onChange={handleChange} required /></label>
        <label>Password<input autoComplete="new-password" name="password" type="password" value={values.password} onChange={handleChange} minLength="6" required /></label>
        <label>Confirm password<input autoComplete="new-password" name="confirmPassword" type="password" value={values.confirmPassword} onChange={handleChange} required /></label>
        {(fieldError || error) && <p className="form-error" role="alert">{fieldError || error}</p>}
        <button className="button" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
        <p className="auth-switch">Already a member? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  )
}

export default Register