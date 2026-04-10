import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

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

  function updateIngredient(id, key, value) {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i))
  }
  function addIngredient() { setIngredients(prev => [...prev, emptyIngredient()]) }
  function removeIngredient(id) { setIngredients(prev => prev.filter(i => i.id !== id)) }

  function updateStep(id, key, value) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [key]: value } : s))
  }
  function addStep() { setSteps(prev => [...prev, emptyStep()]) }
  function removeStep(id) { setSteps(prev => prev.filter(s => s.id !== id)) }

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
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-3xl)' }}>
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1>Add a Recipe</h1>
      </div>

      <div className="two-col-equal">
        <div style={s.col}>
          {/* Basics */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>The Basics</h2>

            <div style={s.field}>
              <label style={s.label}>Recipe title *</label>
              <input className="form-input" type="text" placeholder="e.g. Grandma's Lemon Cake"
                value={form.title} onChange={e => setField('title', e.target.value)} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Short description</label>
              <textarea className="form-input" placeholder="A few words about this dish…"
                value={form.description} onChange={e => setField('description', e.target.value)} rows={3} />
            </div>

            <div className="form-row">
              <div style={s.field}>
                <label style={s.label}>Category</label>
                <select className="form-input" value={form.category} onChange={e => setField('category', e.target.value)}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Servings</label>
                <input className="form-input" type="number" min="1" placeholder="4"
                  value={form.servings} onChange={e => setField('servings', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div style={s.field}>
                <label style={s.label}>Prep time (min)</label>
                <input className="form-input" type="number" min="0" placeholder="15"
                  value={form.prep_time_minutes} onChange={e => setField('prep_time_minutes', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Cook time (min)</label>
                <input className="form-input" type="number" min="0" placeholder="45"
                  value={form.cook_time_minutes} onChange={e => setField('cook_time_minutes', e.target.value)} />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Photo URL (optional)</label>
              <input className="form-input" type="url" placeholder="https://…"
                value={form.image_url} onChange={e => setField('image_url', e.target.value)} />
            </div>

            <label style={s.checkboxRow}>
              <input type="checkbox" checked={form.is_family_original}
                onChange={e => setField('is_family_original', e.target.checked)}
                style={{ accentColor: 'var(--color-accent)' }} />
              <span>This is a family original recipe</span>
            </label>

            {form.is_family_original && (
              <div style={{ ...s.field, marginTop: 'var(--space-md)' }}>
                <label style={s.label}>Family note</label>
                <textarea className="form-input"
                  placeholder="Where did this recipe come from? Any special memories?"
                  value={form.family_note} onChange={e => setField('family_note', e.target.value)} rows={3} />
              </div>
            )}
          </section>

          {/* Ingredients */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Ingredients</h2>
            <div style={s.ingHeader}>
              <span style={{ ...s.colLabel, flex: '0 0 72px' }}>Amount</span>
              <span style={{ ...s.colLabel, flex: '0 0 64px' }}>Unit</span>
              <span style={{ ...s.colLabel, flex: 1 }}>Ingredient</span>
            </div>

            {ingredients.map((ing) => (
              <div key={ing.id} style={s.ingRow}>
                <input className="form-input" style={{ flex: '0 0 72px', textAlign: 'center' }}
                  type="text" placeholder="2"
                  value={ing.amount} onChange={e => updateIngredient(ing.id, 'amount', e.target.value)} />
                <input className="form-input" style={{ flex: '0 0 64px' }}
                  type="text" placeholder="cups"
                  value={ing.unit} onChange={e => updateIngredient(ing.id, 'unit', e.target.value)} />
                <input className="form-input" style={{ flex: 1 }}
                  type="text" placeholder="all-purpose flour"
                  value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} />
                <button style={s.removeBtn} onClick={() => removeIngredient(ing.id)} disabled={ingredients.length === 1}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button style={s.addRowBtn} onClick={addIngredient}>
              <Plus size={14} /> Add ingredient
            </button>
          </section>
        </div>

        <div style={s.col}>
          {/* Steps */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Instructions</h2>
            <p style={s.hint}>Write each step clearly. Add a timer for steps that need it.</p>

            {steps.map((step, idx) => (
              <div key={step.id} style={s.stepRow}>
                <div style={s.stepNum}>{idx + 1}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <textarea
                    className="form-input"
                    placeholder={`Step ${idx + 1}…`}
                    value={step.instruction}
                    onChange={e => updateStep(step.id, 'instruction', e.target.value)}
                    rows={3}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <input
                      className="form-input"
                      style={{ width: 110, fontSize: '0.8125rem' }}
                      type="number" min="0"
                      placeholder="Timer (min)"
                      value={step.timer_minutes}
                      onChange={e => updateStep(step.id, 'timer_minutes', e.target.value)}
                    />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>min (optional)</span>
                  </div>
                </div>
                <button style={s.removeBtn} onClick={() => removeStep(step.id)} disabled={steps.length === 1}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <button style={s.addRowBtn} onClick={addStep}>
              <Plus size={14} /> Add step
            </button>
          </section>

          {error && <p style={s.error}>{error}</p>}

          <div style={s.actions}>
            <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}
              style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Recipe'}
            </button>
          </div>
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
    fontFamily: 'var(--font-body)', marginBottom: 'var(--space-lg)', padding: 0,
  },
  col: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' },
  section: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
    display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)', fontSize: '1.125rem',
    paddingBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--color-border)',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' },
  label: { fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' },
  hint: { fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '-var(--space-sm)' },
  checkboxRow: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
    fontSize: '0.875rem', color: 'var(--color-text-secondary)', cursor: 'pointer',
  },
  ingHeader: {
    display: 'flex', gap: 'var(--space-sm)', paddingBottom: 'var(--space-xs)',
  },
  colLabel: {
    fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  ingRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' },
  stepRow: { display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' },
  stepNum: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--color-accent-light)',
    color: 'var(--color-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0,
    marginTop: 6, fontFamily: 'var(--font-display)',
  },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-tertiary)', padding: 'var(--space-xs)',
    borderRadius: 'var(--radius-sm)', flexShrink: 0,
    display: 'flex', alignItems: 'center',
  },
  addRowBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'none', border: '1px dashed var(--color-border-strong)',
    color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-md)',
    padding: 'var(--space-sm) var(--space-md)', fontSize: '0.875rem',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    width: '100%', justifyContent: 'center',
    transition: 'border-color 0.15s, color 0.15s',
  },
  error: {
    fontSize: '0.875rem', color: 'var(--color-error)',
    background: 'var(--color-error-light)', padding: '10px 14px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-error-border)',
  },
  actions: { display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' },
}
