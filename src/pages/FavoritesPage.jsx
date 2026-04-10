import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Star } from 'lucide-react'

export default function FavoritesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('favorites')
        .select('recipe_id, recipes(id, title, description, category, image_url, prep_time_minutes, cook_time_minutes, profiles(display_name))')
        .eq('user_id', user.id)
      setRecipes((data || []).map(d => d.recipes).filter(Boolean))
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Favorites</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.75rem', fontSize: '0.9375rem' }}>
        {recipes.length} saved recipe{recipes.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : recipes.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '5rem 2rem', textAlign: 'center' }}>
          <Star size={40} color="var(--color-text-tertiary)" />
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>No favorites yet</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Open any recipe and tap the star to save it here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              {recipe.image_url
                ? <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                : <div style={{ height: 100, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={28} color="var(--color-text-tertiary)" /></div>
              }
              <div style={{ padding: '1rem 1.125rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.25rem' }}>{recipe.title}</h3>
                {recipe.description && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{recipe.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
