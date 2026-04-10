import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
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
    <div style={styles.page}>
      <div style={styles.card} className="animate-fade-in">
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 8 10 8 18a8 8 0 0016 0C24 10 16 4 16 4z" fill="#c85c2d" opacity="0.15"/>
              <path d="M16 6C16 6 9 12 9 18a7 7 0 0014 0C23 12 16 6 16 6z" stroke="#c85c2d" strokeWidth="1.5" fill="none"/>
              <path d="M13 17c0 1.66 1.34 3 3 3" stroke="#c85c2d" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={styles.title}>Chihlas Family Kitchen</h1>
          <p style={styles.subtitle}>
            {mode === 'signin' ? 'Welcome back to the table.' : 'Join the family kitchen.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <div style={styles.field}>
              <label style={styles.label}>Your name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. Grandma Rose"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {successMsg && <p style={styles.success}>{successMsg}</p>}

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={styles.toggle}>
          {mode === 'signin' ? (
            <p>New to Chihlas Family Kitchen? <button style={styles.link} onClick={() => { setMode('signup'); setError(null); }}>Create an account</button></p>
          ) : (
            <p>Already have an account? <button style={styles.link} onClick={() => { setMode('signin'); setError(null); }}>Sign in</button></p>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    padding: '2rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-lg)',
    padding: '2.5rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.75rem',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    marginBottom: '0.375rem',
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-secondary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.125rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.01em',
  },
  input: {
    padding: '0.6875rem 0.875rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    background: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  btn: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: 'var(--color-accent)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9375rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.1s',
    fontFamily: 'var(--font-body)',
  },
  error: {
    fontSize: '0.875rem',
    color: '#c0392b',
    background: '#fdf2f2',
    padding: '0.625rem 0.875rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid #f5c6c6',
  },
  success: {
    fontSize: '0.875rem',
    color: 'var(--color-success)',
    background: 'var(--color-success-light)',
    padding: '0.625rem 0.875rem',
    borderRadius: 'var(--radius-sm)',
  },
  toggle: {
    marginTop: '1.5rem',
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
