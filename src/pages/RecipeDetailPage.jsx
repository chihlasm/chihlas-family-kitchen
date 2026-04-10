import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  ArrowLeft, Clock, Users, Star, StarOff, ShoppingCart,
  ChefHat, Pencil, Trash2, MessageSquare
} from 'lucide-react'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)
  const [addedToList, setAddedToList] = useState(false)

  useEffect(() => { fetchRecipe() }, [id])

  async function fetchRecipe() {
    setLoading(true)
    const [{ data: r }, { data: ing }, { data: stp }] = await Promise.all([
      supabase.from('recipes').select('*, profiles(display_name)').eq('id', id).single(),
      supabase.from('ingredients').select('*').eq('recipe_id', id).order('sort_order'),
      supabase.from('steps').select('*').eq('recipe_id', id).order('step_number'),
    ])
    setRecipe(r)
    setIngredients(ing || [])
    setSteps(stp || [])

    if (user) {
      const { data: fav } = await supabase.from('favorites')
        .select('id').eq('user_id', user.id).eq('recipe_id', id).single()
      setIsFav(!!fav)
    }
    setLoading(false)
  }

  async function toggleFavorite() {
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('recipe_id', id)
      setIsFav(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, recipe_id: id })
      setIsFav(true)
    }
  }

  async function addToShoppingList() {
    const items = ingredients.filter(i => i.name).map(ing => ({
      user_id: user.id,
      recipe_id: id,
      ingredient_id: ing.id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      checked: false,
    }))

    await supabase.from('shopping_list').upsert(items, {
      onConflict: 'user_id,ingredient_id',
    })
    setAddedToList(true)
    setTimeout(() => setAddedToList(false), 2500)
  }

  async function deleteRecipe() {
    if (!confirm('Delete this recipe permanently?')) return
    await supabase.from('recipes').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
      <div style={s.spinner} />
    </div>
  )

  if (!recipe) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
      <p style={{ marginBottom: 'var(--space-lg)' }}>Recipe not found.</p>
      <button className="btn-secondary" onClick={() => navigate('/')}>Go home</button>
    </div>
  )

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
  const isOwner = user?.id === recipe.user_id

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-3xl)' }}>
      <button style={s.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back to recipes
      </button>

      {recipe.image_url && (
        <div style={s.hero}>
          <img src={recipe.image_url} alt={recipe.title} style={s.heroImg} />
        </div>
      )}

      <div style={s.titleRow}>
        <div style={{ flex: 1 }}>
          {recipe.is_family_original && (
            <span style={s.originalBadge}>Family Original</span>
          )}
          <h1 style={s.title}>{recipe.title}</h1>
          {recipe.profiles?.display_name && (
            <p style={s.byLine}>by {recipe.profiles.display_name}</p>
          )}
        </div>
        <div style={s.actions}>
          <button style={s.actionBtn} onClick={toggleFavorite} title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
            {isFav ? <Star size={18} fill="#e5a00d" color="#e5a00d" /> : <StarOff size={18} />}
          </button>
          {isOwner && (
            <>
              <button style={s.actionBtn} onClick={() => navigate(`/recipes/${id}/edit`)} title="Edit">
                <Pencil size={16} />
              </button>
              <button style={{ ...s.actionBtn, color: 'var(--color-error)' }} onClick={deleteRecipe} title="Delete">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        {totalTime > 0 && (
          <div style={s.statItem}>
            <Clock size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <div>
              <div style={s.statLabel}>Total</div>
              <div style={s.statValue}>{totalTime} min</div>
            </div>
          </div>
        )}
        {recipe.prep_time_minutes > 0 && (
          <div style={s.statItem}>
            <div>
              <div style={s.statLabel}>Prep</div>
              <div style={s.statValue}>{recipe.prep_time_minutes} min</div>
            </div>
          </div>
        )}
        {recipe.cook_time_minutes > 0 && (
          <div style={s.statItem}>
            <div>
              <div style={s.statLabel}>Cook</div>
              <div style={s.statValue}>{recipe.cook_time_minutes} min</div>
            </div>
          </div>
        )}
        {recipe.servings > 0 && (
          <div style={s.statItem}>
            <Users size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <div>
              <div style={s.statLabel}>Servings</div>
              <div style={s.statValue}>{recipe.servings}</div>
            </div>
          </div>
        )}
      </div>

      {recipe.description && <p style={s.description}>{recipe.description}</p>}

      {recipe.family_note && (
        <div style={s.familyNote}>
          <MessageSquare size={15} style={{ color: 'var(--color-amber)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
            {recipe.family_note}
          </p>
        </div>
      )}

      <div className="two-col">
        {/* Ingredients */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Ingredients</h2>
            <button
              className={`btn-primary btn-sm`}
              style={addedToList ? { background: 'var(--color-success)' } : {}}
              onClick={addToShoppingList}
            >
              <ShoppingCart size={14} />
              {addedToList ? 'Added!' : 'Add to list'}
            </button>
          </div>
          <ul style={s.ingredientList}>
            {ingredients.map(ing => (
              <li key={ing.id} style={s.ingredientItem}>
                <span style={s.ingredientAmount}>
                  {[ing.amount, ing.unit].filter(Boolean).join(' ')}
                </span>
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Instructions</h2>
            <button
              className="btn-primary btn-sm"
              onClick={() => navigate(`/cook/${id}`)}
            >
              <ChefHat size={14} /> Cook Mode
            </button>
          </div>
          <ol style={s.stepList}>
            {steps.map((step, idx) => (
              <li key={step.id} style={s.stepItem}>
                <div style={s.stepNum}>{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={s.stepText}>{step.instruction}</p>
                  {step.timer_minutes && (
                    <span style={s.timerBadge}>
                      <Clock size={11} /> {step.timer_minutes} min
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

const s = {
  backBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-secondary)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', marginBottom: 'var(--space-xl)', padding: 0,
  },
  hero: {
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    marginBottom: 'var(--space-xl)', maxHeight: 340,
  },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  titleRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)',
  },
  originalBadge: {
    display: 'inline-block', fontSize: '0.6875rem', fontWeight: 600,
    padding: '3px 10px', borderRadius: 99, marginBottom: 'var(--space-sm)',
    background: 'var(--color-amber-light)', color: 'var(--color-amber)',
    letterSpacing: '0.02em',
  },
  title: { fontSize: '2rem', lineHeight: 1.15, letterSpacing: '-0.01em' },
  byLine: { fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-xs)' },
  actions: { display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 },
  actionBtn: {
    background: 'var(--color-bg)', border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)',
    cursor: 'pointer', color: 'var(--color-text-secondary)',
    display: 'flex', alignItems: 'center', transition: 'border-color 0.15s',
  },
  stats: {
    display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap',
    padding: 'var(--space-lg) var(--space-xl)',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)',
  },
  statItem: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' },
  statLabel: {
    fontSize: '0.6875rem', color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500,
  },
  statValue: { fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-text-primary)' },
  description: {
    fontSize: '1rem', lineHeight: 1.75, color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-xl)', maxWidth: '65ch',
  },
  familyNote: {
    display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
    background: 'var(--color-amber-light)',
    border: '1px solid var(--color-amber-border)',
    borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)',
    marginBottom: 'var(--space-2xl)',
  },
  section: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
  },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)',
  },
  sectionTitle: { fontSize: '1.125rem' },
  ingredientList: { listStyle: 'none', display: 'flex', flexDirection: 'column' },
  ingredientItem: {
    display: 'flex', gap: 'var(--space-md)', padding: '10px 0',
    borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem',
  },
  ingredientAmount: {
    color: 'var(--color-text-tertiary)', minWidth: 72, flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  stepList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' },
  stepItem: { display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' },
  stepNum: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--color-accent-light)',
    color: 'var(--color-accent)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0, marginTop: 2,
    fontFamily: 'var(--font-display)',
  },
  stepText: { fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--color-text-primary)' },
  timerBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    marginTop: 'var(--space-sm)', fontSize: '0.75rem', fontWeight: 500,
    padding: '3px 8px', borderRadius: 99,
    background: 'var(--color-amber-light)', color: 'var(--color-amber)',
  },
  spinner: {
    width: 28, height: 28,
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
}
