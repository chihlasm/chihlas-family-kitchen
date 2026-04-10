import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Star, Clock, Users } from 'lucide-react'

const CATEGORY_COLORS = {
  breakfast: { bg: 'oklch(0.95 0.04 85)',  text: 'oklch(0.45 0.10 75)' },
  mains:     { bg: 'oklch(0.94 0.035 250)', text: 'oklch(0.42 0.10 250)' },
  sides:     { bg: 'oklch(0.95 0.04 155)',  text: 'oklch(0.40 0.10 155)' },
  desserts:  { bg: 'oklch(0.94 0.035 310)', text: 'oklch(0.42 0.10 310)' },
  soups:     { bg: 'oklch(0.95 0.04 55)',   text: 'oklch(0.45 0.12 50)' },
  sauces:    { bg: 'oklch(0.95 0.035 25)',  text: 'oklch(0.45 0.13 25)' },
  drinks:    { bg: 'oklch(0.95 0.035 200)', text: 'oklch(0.40 0.09 200)' },
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('favorites')
        .select('recipe_id, recipes(id, title, description, category, image_url, prep_time_minutes, cook_time_minutes, servings, is_family_original, profiles(display_name))')
        .eq('user_id', user.id)
      setRecipes((data || []).map(d => d.recipes).filter(Boolean))
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1>Favorites</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginTop: 'var(--space-xs)' }}>
          {recipes.length} saved recipe{recipes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div style={s.empty}><div style={s.spinner} /></div>
      ) : recipes.length === 0 ? (
        <div style={s.empty}>
          <Star size={36} color="var(--color-text-tertiary)" />
          <p style={s.emptyTitle}>No favorites yet</p>
          <p style={s.emptyText}>Open any recipe and tap the star to save it here.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe, idx) => {
            const cat = recipe.category?.toLowerCase()
            const colors = CATEGORY_COLORS[cat] || { bg: 'var(--color-border)', text: 'var(--color-text-secondary)' }

            return (
              <div
                key={recipe.id}
                className="recipe-card stagger-item"
                style={{ '--i': idx }}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                {recipe.image_url && (
                  <div style={{ height: 160, overflow: 'hidden' }}>
                    <img src={recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
                    {recipe.category && (
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600, padding: '2px 10px',
                        borderRadius: 99, background: colors.bg, color: colors.text,
                        textTransform: 'capitalize', letterSpacing: '0.02em',
                      }}>
                        {recipe.category}
                      </span>
                    )}
                    {recipe.is_family_original && (
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600, padding: '2px 10px',
                        borderRadius: 99, background: 'var(--color-amber-light)',
                        color: 'var(--color-amber)', letterSpacing: '0.02em',
                      }}>
                        Family original
                      </span>
                    )}
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.0625rem',
                    fontWeight: 600, marginBottom: 'var(--space-xs)', lineHeight: 1.3,
                  }}>
                    {recipe.title}
                  </h3>
                  {recipe.description && (
                    <p style={{
                      fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
                      lineHeight: 1.5, marginBottom: 'var(--space-md)',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {recipe.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                    {recipe.prep_time_minutes > 0 && (
                      <span style={s.stat}>
                        <Clock size={13} /> {recipe.prep_time_minutes + (recipe.cook_time_minutes || 0)} min
                      </span>
                    )}
                    {recipe.servings > 0 && (
                      <span style={s.stat}>
                        <Users size={13} /> {recipe.servings}
                      </span>
                    )}
                    {recipe.profiles?.display_name && (
                      <span style={{ ...s.stat, marginLeft: 'auto', color: 'var(--color-text-tertiary)' }}>
                        {recipe.profiles.display_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  stat: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 'var(--space-md)',
    padding: 'var(--space-4xl) var(--space-2xl)', textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '1.125rem', fontWeight: 600,
    fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)',
  },
  emptyText: {
    fontSize: '0.9375rem', color: 'var(--color-text-secondary)',
  },
  spinner: {
    width: 28, height: 28,
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
}
