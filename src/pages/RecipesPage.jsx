import { useEffect, useState } from 'react'
import { useNavigate, useParams, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Clock, Users, Search, Plus } from 'lucide-react'

const CATEGORIES = ['Breakfast', 'Mains', 'Sides', 'Desserts', 'Soups', 'Sauces', 'Drinks']

const CATEGORY_COLORS = {
  breakfast: { bg: 'oklch(0.95 0.04 85)',  text: 'oklch(0.45 0.10 75)' },
  mains:     { bg: 'oklch(0.94 0.035 250)', text: 'oklch(0.42 0.10 250)' },
  sides:     { bg: 'oklch(0.95 0.04 155)',  text: 'oklch(0.40 0.10 155)' },
  desserts:  { bg: 'oklch(0.94 0.035 310)', text: 'oklch(0.42 0.10 310)' },
  soups:     { bg: 'oklch(0.95 0.04 55)',   text: 'oklch(0.45 0.12 50)' },
  sauces:    { bg: 'oklch(0.95 0.035 25)',  text: 'oklch(0.45 0.13 25)' },
  drinks:    { bg: 'oklch(0.95 0.035 200)', text: 'oklch(0.40 0.09 200)' },
}

function RecipeCard({ recipe, onClick, index }) {
  const cat = recipe.category?.toLowerCase()
  const colors = CATEGORY_COLORS[cat] || { bg: 'var(--color-border)', text: 'var(--color-text-secondary)' }

  return (
    <div
      className="recipe-card stagger-item"
      style={{ '--i': index }}
      onClick={onClick}
    >
      {recipe.image_url && (
        <div style={cardStyles.img}>
          <img src={recipe.image_url} alt="" style={cardStyles.imgEl} />
        </div>
      )}
      <div style={cardStyles.body}>
        <div style={cardStyles.meta}>
          {recipe.category && (
            <span style={{ ...cardStyles.badge, background: colors.bg, color: colors.text }}>
              {recipe.category}
            </span>
          )}
          {recipe.is_family_original && (
            <span style={cardStyles.familyBadge}>Family original</span>
          )}
        </div>
        <h3 style={cardStyles.title}>{recipe.title}</h3>
        {recipe.description && (
          <p style={cardStyles.desc}>{recipe.description}</p>
        )}
        <div style={cardStyles.stats}>
          {recipe.prep_time_minutes && (
            <span style={cardStyles.stat}>
              <Clock size={13} /> {recipe.prep_time_minutes + (recipe.cook_time_minutes || 0)} min
            </span>
          )}
          {recipe.servings && (
            <span style={cardStyles.stat}>
              <Users size={13} /> {recipe.servings}
            </span>
          )}
          {recipe.profiles?.display_name && (
            <span style={{ ...cardStyles.stat, marginLeft: 'auto', color: 'var(--color-text-tertiary)' }}>
              {recipe.profiles.display_name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { cat } = useParams()
  const { user } = useAuth()

  useEffect(() => { fetchRecipes() }, [])

  async function fetchRecipes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id, title, description, category, image_url,
        prep_time_minutes, cook_time_minutes, servings,
        is_family_original, created_at,
        profiles (display_name)
      `)
      .order('created_at', { ascending: false })

    if (!error) setRecipes(data || [])
    setLoading(false)
  }

  const filtered = recipes.filter(r => {
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !cat || r.category?.toLowerCase() === cat
    return matchSearch && matchCat
  })

  const pageTitle = cat
    ? cat.charAt(0).toUpperCase() + cat.slice(1)
    : 'All Recipes'

  return (
    <div className="animate-fade-in">
      <div style={s.header}>
        <div>
          <h1>{pageTitle}</h1>
          <p style={s.subtitle}>
            {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
            {cat ? ` in ${pageTitle.toLowerCase()}` : ' in the family collection'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/recipes/new')}>
          <Plus size={16} /> Add Recipe
        </button>
      </div>

      <div style={s.searchWrap}>
        <Search size={16} style={s.searchIcon} />
        <input
          className="form-input"
          style={{ maxWidth: 400, paddingLeft: 'var(--space-2xl)' }}
          type="text"
          placeholder="Search recipes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="category-pills" style={{ marginBottom: 'var(--space-xl)' }}>
        <NavLink to="/" end className={({ isActive }) => `pill${isActive ? ' active' : ''}`}>
          All
        </NavLink>
        {CATEGORIES.map(c => (
          <NavLink
            key={c}
            to={`/category/${c.toLowerCase()}`}
            className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
          >
            {c}
          </NavLink>
        ))}
      </div>

      {loading ? (
        <div className="recipe-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} style={s.skeletonCard}>
              <div className="skeleton" style={{ height: 120 }} />
              <div style={{ padding: 'var(--space-lg)' }}>
                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 'var(--space-sm)' }} />
                <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 'var(--space-md)' }} />
                <div className="skeleton" style={{ height: 12, width: '55%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyTitle}>
            {search ? `No recipes match "${search}"` : 'Your family cookbook starts here'}
          </p>
          <p style={s.emptyText}>
            {search
              ? 'Try a different search or browse all recipes.'
              : 'Add your first recipe and start building your collection.'}
          </p>
          {!search && (
            <button className="btn-primary" onClick={() => navigate('/recipes/new')} style={{ marginTop: 'var(--space-lg)' }}>
              <Plus size={16} /> Add your first recipe
            </button>
          )}
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((recipe, idx) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              index={idx}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-xl)',
    gap: 'var(--space-lg)',
    flexWrap: 'wrap',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    fontSize: '0.9375rem',
    marginTop: 'var(--space-xs)',
  },
  searchWrap: {
    position: 'relative',
    marginBottom: 'var(--space-lg)',
  },
  searchIcon: {
    position: 'absolute',
    left: 'var(--space-md)',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-tertiary)',
    pointerEvents: 'none',
  },
  skeletonCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-4xl) var(--space-2xl)',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    color: 'var(--color-text-primary)',
  },
  emptyText: {
    fontSize: '0.9375rem',
    color: 'var(--color-text-secondary)',
    maxWidth: 360,
  },
}

const cardStyles = {
  img: { height: 160, overflow: 'hidden' },
  imgEl: { width: '100%', height: '100%', objectFit: 'cover' },
  body: { padding: 'var(--space-lg)' },
  meta: {
    display: 'flex',
    gap: 'var(--space-sm)',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-sm)',
  },
  badge: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: 99,
    textTransform: 'capitalize',
    letterSpacing: '0.02em',
  },
  familyBadge: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: 99,
    background: 'var(--color-amber-light)',
    color: 'var(--color-amber)',
    letterSpacing: '0.02em',
  },
  title: {
    fontSize: '1.0625rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    marginBottom: 'var(--space-xs)',
    lineHeight: 1.3,
  },
  desc: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
    marginBottom: 'var(--space-md)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8125rem',
    color: 'var(--color-text-secondary)',
  },
}
