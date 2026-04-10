import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Clock, Users, ChefHat, Search, Plus } from 'lucide-react'

const CATEGORY_COLORS = {
  breakfast: { bg: '#fef9ee', border: '#fde68a', text: '#92400e' },
  mains:     { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  sides:     { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  desserts:  { bg: '#fdf4ff', border: '#e9d5ff', text: '#6b21a8' },
  soups:     { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
  sauces:    { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  drinks:    { bg: '#ecfeff', border: '#a5f3fc', text: '#155e75' },
}

function RecipeCard({ recipe, onClick }) {
  const cat = recipe.category?.toLowerCase()
  const colors = CATEGORY_COLORS[cat] || { bg: '#f9fafb', border: '#e5e7eb', text: '#374151' }

  return (
    <div style={styles.card} onClick={onClick} className="animate-fade-in">
      {recipe.image_url ? (
        <div style={styles.cardImg}>
          <img src={recipe.image_url} alt={recipe.title} style={styles.cardImgEl} />
        </div>
      ) : (
        <div style={{ ...styles.cardImgPlaceholder, background: colors.bg }}>
          <ChefHat size={32} color={colors.text} opacity={0.5} />
        </div>
      )}
      <div style={styles.cardBody}>
        <div style={styles.cardMeta}>
          {recipe.category && (
            <span style={{ ...styles.catBadge, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
              {recipe.category}
            </span>
          )}
          {recipe.is_family_original && (
            <span style={styles.familyBadge}>Family original</span>
          )}
        </div>
        <h3 style={styles.cardTitle}>{recipe.title}</h3>
        {recipe.description && (
          <p style={styles.cardDesc}>{recipe.description}</p>
        )}
        <div style={styles.cardStats}>
          {recipe.prep_time_minutes && (
            <span style={styles.stat}>
              <Clock size={13} /> {recipe.prep_time_minutes + (recipe.cook_time_minutes || 0)} min
            </span>
          )}
          {recipe.servings && (
            <span style={styles.stat}>
              <Users size={13} /> {recipe.servings}
            </span>
          )}
          {recipe.profiles?.display_name && (
            <span style={{ ...styles.stat, marginLeft: 'auto', color: 'var(--color-text-tertiary)' }}>
              by {recipe.profiles.display_name}
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
  const { user } = useAuth()

  useEffect(() => {
    fetchRecipes()
  }, [])

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

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>All Recipes</h1>
          <p style={styles.pageSubtitle}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in the family collection</p>
        </div>
        <button style={styles.addBtn} onClick={() => navigate('/recipes/new')}>
          <Plus size={16} />
          Add Recipe
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <Search size={16} style={styles.searchIcon} />
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search by name, category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.empty}>
          <div style={styles.spinner} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          {search ? (
            <>
              <p style={styles.emptyTitle}>No recipes match "{search}"</p>
              <p style={styles.emptyText}>Try a different search or browse all recipes.</p>
            </>
          ) : (
            <>
              <ChefHat size={40} color="var(--color-text-tertiary)" />
              <p style={styles.emptyTitle}>No recipes yet</p>
              <p style={styles.emptyText}>Add your first family recipe to get started.</p>
              <button style={styles.addBtn} onClick={() => navigate('/recipes/new')}>
                <Plus size={16} /> Add your first recipe
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: '1.75rem',
    marginBottom: '0.25rem',
  },
  pageSubtitle: {
    color: 'var(--color-text-secondary)',
    fontSize: '0.9375rem',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5625rem 1.125rem',
    background: 'var(--color-accent)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    whiteSpace: 'nowrap',
  },
  searchWrap: {
    position: 'relative',
    marginBottom: '1.75rem',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.875rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-tertiary)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    maxWidth: '420px',
    padding: '0.625rem 0.875rem 0.625rem 2.5rem',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.15s',
    boxShadow: 'var(--shadow-sm)',
  },
  cardImg: {
    height: 180,
    overflow: 'hidden',
  },
  cardImgEl: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardImgPlaceholder: {
    height: 140,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: '1rem 1.125rem 1.125rem',
  },
  cardMeta: {
    display: 'flex',
    gap: '0.375rem',
    flexWrap: 'wrap',
    marginBottom: '0.5rem',
  },
  catBadge: {
    fontSize: '0.6875rem',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: 20,
    textTransform: 'capitalize',
  },
  familyBadge: {
    fontSize: '0.6875rem',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: 20,
    background: 'var(--color-accent-light)',
    border: '1px solid var(--color-accent-border)',
    color: 'var(--color-accent)',
  },
  cardTitle: {
    fontSize: '1rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 500,
    marginBottom: '0.375rem',
    lineHeight: 1.3,
  },
  cardDesc: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
    marginBottom: '0.75rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.8125rem',
    color: 'var(--color-text-secondary)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '5rem 2rem',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1rem',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  emptyText: {
    fontSize: '0.9rem',
    color: 'var(--color-text-secondary)',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
