import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ArrowRight, X, Clock, CheckCircle } from 'lucide-react'

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
  const r = 28
  const circumference = 2 * Math.PI * r

  return (
    <div style={timerS.wrap}>
      <div style={timerS.circle}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4" />
          <circle
            cx="36" cy="36" r={r} fill="none"
            stroke={done ? 'var(--color-success)' : 'var(--color-accent)'}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={timerS.display}>
          <span style={{ ...timerS.time, color: done ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
            {display}
          </span>
        </div>
      </div>
      <div style={timerS.controls}>
        {done ? (
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-success)' }}>Done!</span>
        ) : running ? (
          <button className="btn-primary btn-sm" onClick={pause}>Pause</button>
        ) : (
          <button className="btn-primary btn-sm" onClick={start}>
            {secondsLeft !== null && secondsLeft < minutes * 60 ? 'Resume' : 'Start'}
          </button>
        )}
        <button className="btn-secondary btn-sm" onClick={reset}>Reset</button>
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
  const [tab, setTab] = useState('steps')

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
      <div style={s.spinner} />
    </div>
  )

  if (!recipe || steps.length === 0) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
      <p style={{ marginBottom: 'var(--space-lg)' }}>No steps found for this recipe.</p>
      <button className="btn-secondary" onClick={() => navigate(-1)}>Go back</button>
    </div>
  )

  const step = steps[current]
  const progressPct = done ? 100 : ((current) / steps.length) * 100

  return (
    <div className="animate-fade-in" style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.exitBtn} onClick={() => navigate(`/recipes/${id}`)}>
          <X size={18} /> Exit
        </button>
        <div style={s.recipeName}>{recipe.title}</div>
        <div style={s.stepCount}>
          {done ? 'Complete!' : `${current + 1} / ${steps.length}`}
        </div>
      </div>

      {/* Progress bar */}
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
      </div>

      {/* Step dots */}
      <div style={s.dots}>
        {steps.map((_, i) => (
          <button
            key={i}
            style={{
              ...s.dot,
              background: i <= current || done ? 'var(--color-accent)' : 'var(--color-border-strong)',
              opacity: i === current && !done ? 1 : i < current || done ? 0.5 : 0.25,
              transform: i === current && !done ? 'scale(1.4)' : 'scale(1)',
            }}
            onClick={() => { setDone(false); setCurrent(i) }}
          />
        ))}
      </div>

      {/* Tab switcher */}
      <div className="tab-bar">
        <button
          className={`tab-btn${tab === 'steps' ? ' active' : ''}`}
          onClick={() => setTab('steps')}
        >
          Steps
        </button>
        <button
          className={`tab-btn${tab === 'ingredients' ? ' active' : ''}`}
          onClick={() => setTab('ingredients')}
        >
          Ingredients
        </button>
      </div>

      {tab === 'ingredients' ? (
        <div style={s.ingredientsPanel}>
          <ul style={s.ingList}>
            {ingredients.map(ing => (
              <li key={ing.id} style={s.ingItem}>
                <span style={s.ingAmount}>{[ing.amount, ing.unit].filter(Boolean).join(' ')}</span>
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : done ? (
        <div style={s.doneScreen}>
          <CheckCircle size={56} color="var(--color-success)" />
          <h2 style={{ fontSize: '1.75rem' }}>Bon appetit!</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem' }}>
            {recipe.title} is ready. Time to eat!
          </p>
          <div style={s.doneActions}>
            <button className="btn-secondary" onClick={goPrev}>
              <ArrowLeft size={15} /> Review steps
            </button>
            <button className="btn-primary" onClick={() => navigate(`/recipes/${id}`)}>
              Back to recipe
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Step content */}
          <div style={s.stepCard} key={current}>
            <div style={s.stepLabel}>Step {current + 1}</div>
            <p style={s.stepText}>{step.instruction}</p>

            {step.timer_minutes && (
              <div style={s.timerSection}>
                <div style={s.timerLabel}>
                  <Clock size={14} color="var(--color-accent)" /> {step.timer_minutes} min timer
                </div>
                <StepTimer minutes={step.timer_minutes} />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div style={s.nav}>
            <button
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center', opacity: current === 0 ? 0.35 : 1 }}
              onClick={goPrev}
              disabled={current === 0}
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={goNext}
            >
              {current === steps.length - 1 ? 'Finish' : 'Next step'} <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth: 680, margin: '0 auto', paddingBottom: 'var(--space-3xl)' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 'var(--space-lg)', gap: 'var(--space-md)',
  },
  exitBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-secondary)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', padding: 0,
  },
  recipeName: {
    fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600,
    color: 'var(--color-text-primary)', flex: 1, textAlign: 'center',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  stepCount: {
    fontSize: '0.875rem', color: 'var(--color-text-tertiary)',
    whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
  },
  progressTrack: {
    height: 3, background: 'var(--color-border)', borderRadius: 99,
    marginBottom: 'var(--space-lg)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: 'var(--color-accent)',
    borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  dots: {
    display: 'flex', gap: 6, justifyContent: 'center',
    marginBottom: 'var(--space-xl)', flexWrap: 'wrap',
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%', border: 'none',
    cursor: 'pointer', transition: 'all 0.2s', padding: 0,
  },
  stepCard: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)',
    marginBottom: 'var(--space-xl)',
    animation: 'fadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  stepLabel: {
    fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--color-accent)',
    marginBottom: 'var(--space-md)', fontFamily: 'var(--font-display)',
  },
  stepText: {
    fontSize: '1.25rem', lineHeight: 1.7,
    color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)',
  },
  timerSection: {
    marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-xl)',
    borderTop: '1px solid var(--color-border)',
  },
  timerLabel: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '0.875rem', color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-lg)',
  },
  nav: { display: 'flex', gap: 'var(--space-md)' },
  ingredientsPanel: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
  },
  ingList: { listStyle: 'none', display: 'flex', flexDirection: 'column' },
  ingItem: {
    display: 'flex', gap: 'var(--space-md)', padding: '10px 0',
    borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem',
    color: 'var(--color-text-primary)',
  },
  ingAmount: {
    color: 'var(--color-text-tertiary)', minWidth: 72, flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  doneScreen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 'var(--space-md)',
    padding: 'var(--space-3xl) var(--space-2xl)', textAlign: 'center',
  },
  doneActions: {
    display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)',
    flexWrap: 'wrap', justifyContent: 'center',
  },
  spinner: {
    width: 28, height: 28,
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
}

const timerS = {
  wrap: { display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', flexWrap: 'wrap' },
  circle: { position: 'relative', width: 72, height: 72, flexShrink: 0 },
  display: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  time: {
    fontSize: '0.875rem', fontWeight: 600,
    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
  },
  controls: { display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' },
}
