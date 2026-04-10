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

    // Check if favorited
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div style={styles.spinner} />
    </div>
  )

  if (!recipe) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p>Recipe not found.</p>
      <button onClick={() => navigate('/')}>Go home</button>
    </div>
  )

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
  const isOwner = user?.id === recipe.user_id

  return (
    <div style={styles.page} className="animate-fade-in">
      {/* Back */}
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back to recipes
      </button>

      {/* Hero */}
      {recipe.image_url && (
        <div style={styles.hero}>
          <img src={recipe.image_url} alt={recipe.title} style={styles.heroImg} />
        </div>
      )}

      {/* Title row */}
      <div style={styles.titleRow}>
        <div style={{ flex: 1 }}>
          {recipe.is_family_original && (
            <span style={styles.originalBadge}>Family Original</span>
          )}
          <h1 style={styles.title}>{recipe.title}</h1>
          {recipe.profiles?.display_name && (
            <p style={styles.byLine}>by {recipe.profiles.display_name}</p>
          )}
        </div>
        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={toggleFavorite} title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
            {isFav ? <Star size={18} fill="currentColor" color="#f59e0b" /> : <StarOff size={18} />}
          </button>
          {isOwner && (
            <>
              <button style={styles.actionBtn} onClick={() => navigate(`/recipes/${id}/edit`)} title="Edit recipe">
                <Pencil size={16} />
              </button>
              <button style={{ ...styles.actionBtn, color: '#c0392b' }} onClick={deleteRecipe} title="Delete recipe">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        {totalTime > 0 && (
          <div style={styles.stat}>
            <Clock size={16} color="var(--color-accent)" />
            <div>
              <div style={styles.statLabel}>Total time</div>
              <div style={styles.statValue}>{totalTime} min</div>
            </div>
          </div>
        )}
        {recipe.prep_time_minutes && (
          <div style={styles.stat}>
            <div>
              <div style={styles.statLabel}>Prep</div>
              <div style={styles.statValue}>{recipe.prep_time_minutes} min</div>
            </div>
          </div>
        )}
        {recipe.cook_time_minutes && (
          <div style={styles.stat}>
            <div>
              <div style={styles.statLabel}>Cook</div>
              <div style={styles.statValue}>{recipe.cook_time_minutes} min</div>
            </div>
          </div>
        )}
        {recipe.servings && (
          <div style={styles.stat}>
            <Users size={16} color="var(--color-accent)" />
            <div>
              <div style={styles.statLabel}>Servings</div>
              <div style={styles.statValue}>{recipe.servings}</div>
            </div>
          </div>
        )}
      </div>

      {recipe.description && <p style={styles.description}>{recipe.description}</p>}

      {/* Family note */}
      {recipe.family_note && (
        <div style={styles.familyNote}>
          <MessageSquare size={15} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, fontStyle: 'italic' }}>{recipe.family_note}</p>
        </div>
      )}

      {/* Main content */}
      <div style={styles.content}>
        {/* Ingredients */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Ingredients</h2>
            <button
              style={{ ...styles.ctaBtn, background: addedToList ? 'var(--color-success)' : 'var(--color-accent)' }}
              onClick={addToShoppingList}
            >
              <ShoppingCart size={15} />
              {addedToList ? 'Added!' : 'Add to shopping list'}
            </button>
          </div>
          <ul style={styles.ingredientList}>
            {ingredients.map(ing => (
              <li key={ing.id} style={styles.ingredientItem}>
                <span style={styles.ingredientAmount}>
                  {[ing.amount, ing.unit].filter(Boolean).join(' ')}
                </span>
                <span style={styles.ingredientName}>{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Instructions</h2>
            <button
              style={styles.ctaBtn}
              onClick={() => navigate(`/cook/${id}`)}
            >
              <ChefHat size={15} />
              Start Cook Mode
            </button>
          </div>
          <ol style={styles.stepList}>
            {steps.map((step, idx) => (
              <li key={step.id} style={styles.stepItem}>
                <div style={styles.stepNumBadge}>{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={styles.stepText}>{step.instruction}</p>
                  {step.timer_minutes && (
                    <span style={styles.timerBadge}>
                      <Clock size={12} /> {step.timer_minutes} min timer
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

const styles = {
  page: { paddingBottom: '3rem' },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-secondary)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', marginBottom: '1.25rem', padding: 0,
  },
  hero: { borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem', maxHeight: 360 },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' },
  originalBadge: {
    display: 'inline-block', fontSize: '0.75rem', fontWeight: 500,
    padding: '3px 10px', borderRadius: 20, marginBottom: '0.5rem',
    background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-border)',
    color: 'var(--color-accent)',
  },
  title: { fontSize: '2rem', lineHeight: 1.2 },
  byLine: { fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.375rem' },
  actions: { display: 'flex', gap: '0.375rem', flexShrink: 0 },
  actionBtn: {
    background: 'var(--color-bg)', border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)', padding: '0.5rem',
    cursor: 'pointer', color: 'var(--color-text-secondary)',
    display: 'flex', alignItems: 'center',
  },
  stats: {
    display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
    padding: '1rem 1.25rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
    boxShadow: 'var(--shadow-sm)',
  },
  stat: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  statLabel: { fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-text-primary)' },
  description: { fontSize: '1rem', lineHeight: 1.75, color: 'var(--color-text-secondary)', marginBottom: '1.25rem' },
  familyNote: {
    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
    background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-border)',
    borderRadius: 'var(--radius-md)', padding: '1rem 1.125rem', marginBottom: '1.5rem',
    color: 'var(--color-text-secondary)',
  },
  content: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' },
  section: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)',
  },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.125rem', flexWrap: 'wrap', gap: '0.75rem' },
  sectionTitle: { fontSize: '1.125rem' },
  ctaBtn: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.4375rem 0.875rem',
    background: 'var(--color-accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    transition: 'background 0.2s',
  },
  ingredientList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0' },
  ingredientItem: {
    display: 'flex', gap: '0.75rem', padding: '0.625rem 0',
    borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem',
  },
  ingredientAmount: { color: 'var(--color-text-tertiary)', minWidth: '80px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  ingredientName: { color: 'var(--color-text-primary)' },
  stepList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  stepItem: { display: 'flex', gap: '1rem', alignItems: 'flex-start' },
  stepNumBadge: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-border)',
    color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0, marginTop: '2px',
  },
  stepText: { fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--color-text-primary)' },
  timerBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 500,
    padding: '3px 8px', borderRadius: 20,
    background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412',
  },
  spinner: {
    width: 32, height: 32, border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
