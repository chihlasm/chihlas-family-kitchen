import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/')
    } else {
      if (!displayName.trim()) {
        setError('Please enter your name.')
        setLoading(false)
        return
      }
      const { error } = await signUp(email, password, displayName)
      if (error) setError(error.message)
      else setSuccessMsg('Account created! Check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.inner} className="animate-fade-in">
        <div style={s.brand}>
          <h1 style={s.title}>Chihlas Family Kitchen</h1>
          <div style={s.dot} />
          <p style={s.subtitle}>
            {mode === 'signin' ? 'Welcome back to the table.' : 'Join the family kitchen.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {mode === 'signup' && (
            <div style={s.field}>
              <label style={s.label}>Your name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Grandma Rose"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              className="form-input"
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={s.error}>{error}</p>}
          {successMsg && <p style={s.success}>{successMsg}</p>}

          <button
            className="btn-primary btn-full"
            type="submit"
            disabled={loading}
            style={{ padding: '12px', fontSize: '0.9375rem', marginTop: 'var(--space-sm)', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={s.toggle}>
          {mode === 'signin' ? (
            <p>New here? <button style={s.link} onClick={() => { setMode('signup'); setError(null) }}>Create an account</button></p>
          ) : (
            <p>Already have an account? <button style={s.link} onClick={() => { setMode('signin'); setError(null) }}>Sign in</button></p>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    padding: 'var(--space-2xl) var(--space-lg)',
  },
  inner: {
    width: '100%',
    maxWidth: 380,
  },
  brand: {
    textAlign: 'center',
    marginBottom: 'var(--space-3xl)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.25rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'var(--color-accent)',
    margin: 'var(--space-lg) auto',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
  },
  error: {
    fontSize: '0.875rem',
    color: 'var(--color-error)',
    background: 'var(--color-error-light)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-error-border)',
  },
  success: {
    fontSize: '0.875rem',
    color: 'var(--color-success)',
    background: 'var(--color-success-light)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
  },
  toggle: {
    marginTop: 'var(--space-2xl)',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)',
  },
  link: {
    background: 'none',
    border: 'none',
    color: 'var(--color-accent)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    padding: 0,
  },
}
