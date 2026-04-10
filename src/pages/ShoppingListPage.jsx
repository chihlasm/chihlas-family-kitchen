import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ShoppingCart, Trash2, CheckSquare, Square, RefreshCw } from 'lucide-react'

export default function ShoppingListPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchList() }, [])

  async function fetchList() {
    setLoading(true)
    const { data } = await supabase
      .from('shopping_list')
      .select('*, recipes(title)')
      .eq('user_id', user.id)
      .order('checked')
      .order('recipes(title)')
      .order('name')
    setItems(data || [])
    setLoading(false)
  }

  async function toggleItem(item) {
    const newChecked = !item.checked
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: newChecked } : i))
    await supabase.from('shopping_list').update({ checked: newChecked }).eq('id', item.id)
  }

  async function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('shopping_list').delete().eq('id', id)
  }

  async function clearChecked() {
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    setItems(prev => prev.filter(i => !i.checked))
    await supabase.from('shopping_list').delete().in('id', checkedIds)
  }

  async function clearAll() {
    if (!confirm('Clear the entire shopping list?')) return
    setItems([])
    await supabase.from('shopping_list').delete().eq('user_id', user.id)
  }

  // Group by recipe
  const byRecipe = items.reduce((acc, item) => {
    const key = item.recipes?.title || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Shopping List</h1>
          <p style={styles.subtitle}>
            {totalCount === 0 ? 'Your list is empty' : `${checkedCount} of ${totalCount} items checked off`}
          </p>
        </div>
        <div style={styles.headerActions}>
          {checkedCount > 0 && (
            <button style={styles.secondaryBtn} onClick={clearChecked}>
              <RefreshCw size={14} /> Clear checked
            </button>
          )}
          {totalCount > 0 && (
            <button style={{ ...styles.secondaryBtn, color: '#c0392b', borderColor: '#fecaca' }} onClick={clearAll}>
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressBar, width: `${(checkedCount / totalCount) * 100}%` }} />
        </div>
      )}

      {loading ? (
        <div style={styles.empty}><div style={styles.spinner} /></div>
      ) : totalCount === 0 ? (
        <div style={styles.empty}>
          <ShoppingCart size={40} color="var(--color-text-tertiary)" />
          <p style={styles.emptyTitle}>Your shopping list is empty</p>
          <p style={styles.emptyText}>Open any recipe and tap "Add to shopping list" to populate it.</p>
        </div>
      ) : (
        <div style={styles.groups}>
          {Object.entries(byRecipe).map(([recipeName, groupItems]) => (
            <div key={recipeName} style={styles.group}>
              <div style={styles.groupHeader}>
                <span style={styles.groupTitle}>{recipeName}</span>
                <span style={styles.groupCount}>{groupItems.filter(i => i.checked).length}/{groupItems.length}</span>
              </div>
              <div style={styles.groupItems}>
                {groupItems.map(item => (
                  <div key={item.id} style={{ ...styles.item, opacity: item.checked ? 0.5 : 1 }}>
                    <button style={styles.checkBtn} onClick={() => toggleItem(item)}>
                      {item.checked
                        ? <CheckSquare size={20} color="var(--color-accent)" fill="var(--color-accent-light)" />
                        : <Square size={20} color="var(--color-border-strong)" />
                      }
                    </button>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        ...styles.itemName,
                        textDecoration: item.checked ? 'line-through' : 'none',
                        color: item.checked ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                      }}>
                        {item.name}
                      </span>
                      {(item.amount || item.unit) && (
                        <span style={styles.itemAmount}>
                          {[item.amount, item.unit].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                    <button style={styles.removeBtn} onClick={() => removeItem(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' },
  title: { fontSize: '1.75rem', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--color-text-secondary)', fontSize: '0.9375rem' },
  headerActions: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.4375rem 0.875rem',
    background: 'none', border: '1px solid var(--color-border-strong)',
    color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  progressWrap: {
    height: 4, background: 'var(--color-border)', borderRadius: 99,
    marginBottom: '2rem', overflow: 'hidden',
  },
  progressBar: {
    height: '100%', background: 'var(--color-accent)',
    borderRadius: 99, transition: 'width 0.4s ease',
  },
  groups: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  group: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
  },
  groupHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.75rem 1.25rem',
    background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)',
  },
  groupTitle: { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' },
  groupCount: { fontSize: '0.75rem', color: 'var(--color-text-tertiary)' },
  groupItems: { padding: '0.25rem 0' },
  item: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.625rem 1.25rem',
    borderBottom: '1px solid var(--color-border)',
    transition: 'opacity 0.2s',
  },
  checkBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, padding: 0 },
  itemName: { fontSize: '0.9375rem', display: 'block', transition: 'color 0.2s' },
  itemAmount: { fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', display: 'block', marginTop: '1px' },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-tertiary)', padding: '0.25rem',
    display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '0.75rem', padding: '5rem 2rem',
    textAlign: 'center',
  },
  emptyTitle: { fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' },
  emptyText: { fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: 320 },
  spinner: { width: 32, height: 32, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}
