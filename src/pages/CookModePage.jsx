import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ArrowRight, X, Clock, CheckCircle, ChefHat } from 'lucide-react'

function useTimer(minutes) {
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  function start() {
    if (secondsLeft === null) setSecondsLeft(minutes * 60)
    setRunning(true)
  }

  function pause() { setRunning(false) }

  function reset() {
    setRunning(false)
    setSecondsLeft(minutes * 60)
  }

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { setRunning(false); clearInterval(intervalRef.current); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, secondsLeft])

  const display = secondsLeft !== null
    ? `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:00`

  const done = secondsLeft === 0
  const progress = secondsLeft !== null ? 1 - (secondsLeft / (minutes * 60)) : 0

  return { display, running, done, progress, start, pause, reset }
}

function StepTimer({ minutes }) {
  const { display, running, done, progress, start, pause, reset } = useTimer(minutes)
  const circumference = 2 * Math.PI * 28

  return (
    <div style={timerStyles.wrap}>
      <div style={timerStyles.circle}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(200,92,45,0.15)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r="28" fill="none"
            stroke={done ? '#2d6a4f' : '#c85c2d'} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={timerStyles.display}>
          <span style={{ ...timerStyles.time, color: done ? 'var(--color-success)' : 'inherit' }}>{display}</span>
        </div>
      </div>
      <div style={timerStyles.controls}>
        {done ? (
          <span style={timerStyles.doneLabel}>Done!</span>
        ) : running ? (
          <button style={timerStyles.btn} onClick={pause}>Pause</button>
        ) : (
          <button style={timerStyles.btn} onClick={start}>
            {secondsLeft !== null && secondsLeft < minutes * 60 ? 'Resume' : 'Start timer'}
          </button>
        )}
        <button style={timerStyles.resetBtn} onClick={reset}>Reset</button>
      </div>
    </div>
  )
}

export default function CookModePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [steps, setSteps] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const [{ data: r }, { data: stp }, { data: ing }] = await Promise.all([
      supabase.from('recipes').select('id, title, servings').eq('id', id).single(),
      supabase.from('steps').select('*').eq('recipe_id', id).order('step_number'),
      supabase.from('ingredients').select('*').eq('recipe_id', id).order('sort_order'),
    ])
    setRecipe(r)
    setSteps(stp || [])
    setIngredients(ing || [])
    setLoading(false)
  }

  function goNext() {
    if (current < steps.length - 1) setCurrent(c => c + 1)
    else setDone(true)
  }

  function goPrev() {
    if (done) { setDone(false); return }
    if (current > 0) setCurrent(c => c - 1)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={styles.spinner} />
    </div>
  )

  if (!recipe || steps.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p>No steps found for this recipe.</p>
      <button onClick={() => navigate(-1)}>Go back</button>
    </div>
  )

  const step = steps[current]
  const progressPct = done ? 100 : ((current) / steps.length) * 100

  return (
    <div style={styles.page} className="animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.exitBtn} onClick={() => navigate(`/recipes/${id}`)}>
          <X size={18} /> Exit cook mode
        </button>
        <div style={styles.recipeName}>{recipe.title}</div>
        <div style={styles.stepCount}>
          {done ? 'Complete!' : `Step ${current + 1} of ${steps.length}`}
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
      </div>

      {/* Step dots */}
      <div style={styles.dots}>
        {steps.map((_, i) => (
          <button
            key={i}
            style={{
              ...styles.dot,
              background: i < current || done ? 'var(--color-accent)' : i === current ? 'var(--color-accent)' : 'var(--color-border-strong)',
              opacity: i === current && !done ? 1 : i < current || done ? 0.7 : 0.3,
              transform: i === current && !done ? 'scale(1.3)' : 'scale(1)',
            }}
            onClick={() => { setDone(false); setCurrent(i) }}
          />
        ))}
      </div>

      {/* Main content */}
      {done ? (
        <div style={styles.doneScreen}>
          <div style={styles.doneIcon}>
            <CheckCircle size={64} color="var(--color-success)" />
          </div>
          <h2 style={styles.doneTitle}>You did it!</h2>
          <p style={styles.doneText}>{recipe.title} is ready. Time to eat!</p>
          <div style={styles.doneActions}>
            <button style={styles.secondaryBtn} onClick={goPrev}>
              <ArrowLeft size={15} /> Review steps
            </button>
            <button style={styles.primaryBtn} onClick={() => navigate(`/recipes/${id}`)}>
              Back to recipe
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.body}>
          {/* Step card */}
          <div style={styles.stepCard} key={current}>
            <div style={styles.stepNumRow}>
              <span style={styles.stepNumLabel}>Step {current + 1}</span>
            </div>
            <p style={styles.stepText}>{step.instruction}</p>

            {step.timer_minutes && (
              <div style={styles.timerSection}>
                <div style={styles.timerLabel}>
                  <Clock size={14} color="var(--color-accent)" /> {step.timer_minutes} minute timer
                </div>
                <StepTimer minutes={step.timer_minutes} />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div style={styles.nav}>
            <button
              style={{ ...styles.navBtn, opacity: current === 0 ? 0.35 : 1 }}
              onClick={goPrev}
              disabled={current === 0}
            >
              <ArrowLeft size={18} /> Previous
            </button>
            <button style={styles.navBtnPrimary} onClick={goNext}>
              {current === steps.length - 1 ? 'Finish' : 'Next step'} <ArrowRight size={18} />
            </button>
          </div>

          {/* Ingredients sidebar */}
          <div style={styles.ingredientsPanel}>
            <h3 style={styles.ingPanelTitle}>Ingredients</h3>
            <ul style={styles.ingList}>
              {ingredients.map(ing => (
                <li key={ing.id} style={styles.ingItem}>
                  <span style={styles.ingAmount}>{[ing.amount, ing.unit].filter(Boolean).join(' ')}</span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: 760, margin: '0 auto', paddingBottom: '3rem' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1rem', gap: '1rem',
  },
  exitBtn: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-secondary)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', padding: 0,
  },
  recipeName: {
    fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500,
    color: 'var(--color-text-primary)', flex: 1, textAlign: 'center',
  },
  stepCount: { fontSize: '0.875rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' },
  progressTrack: {
    height: 3, background: 'var(--color-border)', borderRadius: 99,
    marginBottom: '1rem', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: 'var(--color-accent)',
    borderRadius: 99, transition: 'width 0.4s ease',
  },
  dots: { display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' },
  dot: {
    width: 8, height: 8, borderRadius: '50%', border: 'none',
    cursor: 'pointer', transition: 'all 0.2s', padding: 0,
  },
  body: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  stepCard: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: '2rem',
    boxShadow: 'var(--shadow-md)', animation: 'fadeIn 0.25s ease',
  },
  stepNumRow: { marginBottom: '1rem' },
  stepNumLabel: {
    fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--color-accent)',
  },
  stepText: { fontSize: '1.25rem', lineHeight: 1.75, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' },
  timerSection: {
    marginTop: '1.75rem', paddingTop: '1.5rem',
    borderTop: '1px solid var(--color-border)',
  },
  timerLabel: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem',
  },
  nav: { display: 'flex', gap: '0.75rem', justifyContent: 'space-between' },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.75rem 1.25rem', border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-md)', background: 'none',
    color: 'var(--color-text-secondary)', fontSize: '0.9375rem',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  navBtnPrimary: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.75rem 1.75rem',
    background: 'var(--color-accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', fontSize: '0.9375rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--font-body)', marginLeft: 'auto',
  },
  ingredientsPanel: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem',
    boxShadow: 'var(--shadow-sm)',
  },
  ingPanelTitle: { fontSize: '0.875rem', marginBottom: '0.875rem', color: 'var(--color-text-secondary)' },
  ingList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0' },
  ingItem: {
    display: 'flex', gap: '0.75rem', padding: '0.5rem 0',
    borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
  },
  ingAmount: { color: 'var(--color-text-tertiary)', minWidth: '80px', flexShrink: 0 },
  doneScreen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '1rem', padding: '3rem 2rem', textAlign: 'center',
  },
  doneIcon: { animation: 'fadeIn 0.4s ease' },
  doneTitle: { fontSize: '2rem', fontFamily: 'var(--font-display)' },
  doneText: { fontSize: '1.0625rem', color: 'var(--color-text-secondary)' },
  doneActions: { display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.625rem 1.25rem', border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-md)', background: 'none', color: 'var(--color-text-secondary)',
    fontSize: '0.9375rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  primaryBtn: {
    padding: '0.625rem 1.5rem', background: 'var(--color-accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  spinner: { width: 32, height: 32, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}

const timerStyles = {
  wrap: { display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' },
  circle: { position: 'relative', width: 80, height: 80, flexShrink: 0 },
  display: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  time: { fontSize: '0.875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' },
  controls: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  btn: {
    padding: '0.4375rem 1rem', background: 'var(--color-accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
    fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  resetBtn: {
    padding: '0.4375rem 0.75rem', background: 'none',
    border: '1px solid var(--color-border-strong)', color: 'var(--color-text-secondary)',
    borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  doneLabel: { fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-success)' },
}
