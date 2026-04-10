import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Trash2, ArrowLeft, GripVertical } from 'lucide-react'

const CATEGORIES = ['Breakfast', 'Mains', 'Sides', 'Desserts', 'Soups', 'Sauces', 'Drinks']

const emptyIngredient = () => ({ id: crypto.randomUUID(), amount: '', unit: '', name: '' })
const emptyStep = () => ({ id: crypto.randomUUID(), instruction: '', timer_minutes: '' })

export default function AddRecipePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    servings: '',
    prep_time_minutes: '',
    cook_time_minutes: '',
    is_family_original: false,
    family_note: '',
    image_url: '',
  })

  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [steps, setSteps] = useState([emptyStep()])

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Ingredients
  function updateIngredient(id, key, value) {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i))
  }
  function addIngredient() {
    setIngredients(prev => [...prev, emptyIngredient()])
  }
  function removeIngredient(id) {
    setIngredients(prev => prev.filter(i => i.id !== id))
  }

  // Steps
  function updateStep(id, key, value) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [key]: value } : s))
  }
  function addStep() {
    setSteps(prev => [...prev, emptyStep()])
  }
  function removeStep(id) {
    setSteps(prev => prev.filter(s => s.id !== id))
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Recipe title is required.'); return }
    if (ingredients.every(i => !i.name.trim())) { setError('Add at least one ingredient.'); return }
    if (steps.every(s => !s.instruction.trim())) { setError('Add at least one step.'); return }

    setSaving(true)
    setError(null)

    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category || null,
        servings: form.servings ? parseInt(form.servings) : null,
        prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes) : null,
        cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
        is_family_original: form.is_family_original,
        family_note: form.family_note.trim() || null,
        image_url: form.image_url.trim() || null,
      })
      .select()
      .single()

    if (recipeErr) { setError(recipeErr.message); setSaving(false); return }

    // Insert ingredients
    const validIngredients = ingredients.filter(i => i.name.trim())
    if (validIngredients.length > 0) {
      await supabase.from('ingredients').insert(
        validIngredients.map((ing, idx) => ({
          recipe_id: recipe.id,
          sort_order: idx,
          amount: ing.amount.trim() || null,
          unit: ing.unit.trim() || null,
          name: ing.name.trim(),
        }))
      )
    }

    // Insert steps
    const validSteps = steps.filter(s => s.instruction.trim())
    if (validSteps.length > 0) {
      await supabase.from('steps').insert(
        validSteps.map((step, idx) => ({
          recipe_id: recipe.id,
          step_number: idx + 1,
          instruction: step.instruction.trim(),
          timer_minutes: step.timer_minutes ? parseInt(step.timer_minutes) : null,
        }))
      )
    }

    navigate(`/recipes/${recipe.id}`)
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={styles.title}>Add a Recipe</h1>
      </div>

      <div style={styles.layout}>
        {/* Left column */}
        <div style={styles.col}>

          {/* Basics card */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>The Basics</h2>

            <div style={styles.field}>
              <label style={styles.label}>Recipe title *</label>
              <input style={styles.input} type="text" placeholder="e.g. Grandma's Lemon Cake"
                value={form.title} onChange={e => setField('title', e.target.value)} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Short description</label>
              <textarea style={{ ...styles.input, ...styles.textarea }} placeholder="A few words about this dish…"
                value={form.description} onChange={e => setField('description', e.target.value)} rows={3} />
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Category</label>
                <select style={styles.input} value={form.category} onChange={e => setField('category', e.target.value)}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Servings</label>
                <input style={styles.input} type="number" min="1" placeholder="4"
                  value={form.servings} onChange={e => setField('servings', e.target.value)} />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Prep time (min)</label>
                <input style={styles.input} type="number" min="0" placeholder="15"
                  value={form.prep_time_minutes} onChange={e => setField('prep_time_minutes', e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Cook time (min)</label>
                <input style={styles.input} type="number" min="0" placeholder="45"
                  value={form.cook_time_minutes} onChange={e => setField('cook_time_minutes', e.target.value)} />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Photo URL (optional)</label>
              <input style={styles.input} type="url" placeholder="https://…"
                value={form.image_url} onChange={e => setField('image_url', e.target.value)} />
            </div>

            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={form.is_family_original}
                onChange={e => setField('is_family_original', e.target.checked)} />
              <span>This is a family original recipe</span>
            </label>

            {form.is_family_original && (
              <div style={{ ...styles.field, marginTop: '0.75rem' }}>
                <label style={styles.label}>Family note</label>
                <textarea style={{ ...styles.input, ...styles.textarea }}
                  placeholder="Where did this recipe come from? Any special memories?"
                  value={form.family_note} onChange={e => setField('family_note', e.target.value)} rows={3} />
              </div>
            )}
          </section>

          {/* Ingredients card */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Ingredients</h2>
            <div style={styles.ingredientHeader}>
              <span style={{ ...styles.colLabel, flex: '0 0 80px' }}>Amount</span>
              <span style={{ ...styles.colLabel, flex: '0 0 70px' }}>Unit</span>
              <span style={{ ...styles.colLabel, flex: 1 }}>Ingredient</span>
            </div>

            {ingredients.map((ing, idx) => (
              <div key={ing.id} style={styles.ingredientRow}>
                <input style={{ ...styles.input, flex: '0 0 80px', textAlign: 'center' }}
                  type="text" placeholder="2"
                  value={ing.amount} onChange={e => updateIngredient(ing.id, 'amount', e.target.value)} />
                <input style={{ ...styles.input, flex: '0 0 70px' }}
                  type="text" placeholder="cups"
                  value={ing.unit} onChange={e => updateIngredient(ing.id, 'unit', e.target.value)} />
                <input style={{ ...styles.input, flex: 1 }}
                  type="text" placeholder="all-purpose flour"
                  value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} />
                <button style={styles.removeBtn} onClick={() => removeIngredient(ing.id)}
                  disabled={ingredients.length === 1}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button style={styles.addRowBtn} onClick={addIngredient}>
              <Plus size={14} /> Add ingredient
            </button>
          </section>
        </div>

        {/* Right column — Steps */}
        <div style={styles.col}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Instructions</h2>
            <p style={styles.hint}>Write each step clearly. Add a timer for steps that need it.</p>

            {steps.map((step, idx) => (
              <div key={step.id} style={styles.stepRow}>
                <div style={styles.stepNum}>{idx + 1}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea
                    style={{ ...styles.input, ...styles.textarea }}
                    placeholder={`Step ${idx + 1}…`}
                    value={step.instruction}
                    onChange={e => updateStep(step.id, 'instruction', e.target.value)}
                    rows={3}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      style={{ ...styles.input, width: '120px', fontSize: '0.8125rem' }}
                      type="number" min="0"
                      placeholder="Timer (min)"
                      value={step.timer_minutes}
                      onChange={e => updateStep(step.id, 'timer_minutes', e.target.value)}
                    />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>minutes (optional)</span>
                  </div>
                </div>
                <button style={styles.removeBtn} onClick={() => removeStep(step.id)} disabled={steps.length === 1}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button style={styles.addRowBtn} onClick={addStep}>
              <Plus size={14} /> Add step
            </button>
          </section>

          {/* Save area */}
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.actions}>
            <button style={styles.cancelBtn} onClick={() => navigate(-1)}>Cancel</button>
            <button style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Recipe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { paddingBottom: '3rem' },
  header: { marginBottom: '1.75rem' },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-secondary)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', marginBottom: '1rem',
    padding: 0,
  },
  title: { fontSize: '1.75rem' },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    alignItems: 'start',
  },
  col: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxShadow: 'var(--shadow-sm)',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.125rem',
    fontWeight: 500,
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--color-border)',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  label: { fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' },
  input: {
    padding: '0.5625rem 0.75rem',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'var(--font-body)',
  },
  textarea: { resize: 'vertical', lineHeight: 1.6 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' },
  checkboxRow: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.875rem', color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  hint: { fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '-0.25rem' },
  ingredientHeader: { display: 'flex', gap: '0.5rem', paddingBottom: '0.25rem' },
  colLabel: { fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  ingredientRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  stepRow: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  stepNum: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--color-accent-light)',
    border: '1px solid var(--color-accent-border)',
    color: 'var(--color-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0, marginTop: '0.375rem',
  },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-tertiary)', padding: '0.25rem',
    borderRadius: 'var(--radius-sm)', flexShrink: 0,
    display: 'flex', alignItems: 'center',
  },
  addRowBtn: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    background: 'none', border: '1px dashed var(--color-border-strong)',
    color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-md)',
    padding: '0.5rem 0.875rem', fontSize: '0.875rem',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    width: '100%', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  error: {
    fontSize: '0.875rem', color: '#c0392b',
    background: '#fdf2f2', padding: '0.625rem 0.875rem',
    borderRadius: 'var(--radius-sm)', border: '1px solid #f5c6c6',
  },
  actions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '0.625rem 1.25rem',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-md)',
    background: 'none',
    color: 'var(--color-text-secondary)',
    fontSize: '0.9375rem', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  saveBtn: {
    padding: '0.625rem 1.5rem',
    background: 'var(--color-accent)',
    color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9375rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
}
