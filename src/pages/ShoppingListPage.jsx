import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ShoppingCart, Trash2, Check, Square, RefreshCw } from 'lucide-react'

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

  const byRecipe = items.reduce((acc, item) => {
    const key = item.recipes?.title || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length
  const progressPct = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0

  return (
    <div className="animate-fade-in">
      <div style={s.header}>
        <div>
          <h1>Shopping List</h1>
          <p style={s.subtitle}>
            {totalCount === 0
              ? 'Your list is empty'
              : `${checkedCount} of ${totalCount} items checked off`}
          </p>
        </div>
        <div style={s.headerActions}>
          {checkedCount > 0 && (
            <button className="btn-secondary btn-sm" onClick={clearChecked}>
              <RefreshCw size={13} /> Clear checked
            </button>
          )}
          {totalCount > 0 && (
            <button className="btn-secondary btn-sm btn-danger" onClick={clearAll}>
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <div style={s.progressWrap}>
          <div style={{ ...s.progressBar, width: `${progressPct}%` }} />
        </div>
      )}

      {loading ? (
        <div style={s.empty}><div style={s.spinner} /></div>
      ) : totalCount === 0 ? (
        <div style={s.empty}>
          <ShoppingCart size={36} color="var(--color-text-tertiary)" />
          <p style={s.emptyTitle}>Your shopping list is empty</p>
          <p style={s.emptyText}>
            Open any recipe and tap "Add to list" to populate it.
          </p>
        </div>
      ) : (
        <div style={s.groups}>
          {Object.entries(byRecipe).map(([recipeName, groupItems]) => (
            <div key={recipeName} style={s.group}>
              <div style={s.groupHeader}>
                <span style={s.groupTitle}>{recipeName}</span>
                <span style={s.groupCount}>
                  {groupItems.filter(i => i.checked).length}/{groupItems.length}
                </span>
              </div>
              <div>
                {groupItems.map(item => (
                  <div
                    key={item.id}
                    style={{ ...s.item, opacity: item.checked ? 0.45 : 1 }}
                    onClick={() => toggleItem(item)}
                  >
                    <div style={s.checkbox}>
                      {item.checked ? (
                        <div style={s.checkboxChecked}>
                          <Check size={12} color="oklch(0.99 0 0)" strokeWidth={3} />
                        </div>
                      ) : (
                        <Square size={20} color="var(--color-border-strong)" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        ...s.itemName,
                        textDecoration: item.checked ? 'line-through' : 'none',
                        color: item.checked ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                      }}>
                        {item.name}
                      </span>
                      {(item.amount || item.unit) && (
                        <span style={s.itemAmount}>
                          {[item.amount, item.unit].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                    <button
                      style={s.removeBtn}
                      onClick={e => { e.stopPropagation(); removeItem(item.id) }}
                    >
                      <Trash2 size={13} />
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

const s = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 'var(--space-xl)', gap: 'var(--space-lg)', flexWrap: 'wrap',
  },
  subtitle: {
    color: 'var(--color-text-secondary)', fontSize: '0.9375rem',
    marginTop: 'var(--space-xs)',
  },
  headerActions: { display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' },
  progressWrap: {
    height: 3, background: 'var(--color-border)', borderRadius: 99,
    marginBottom: 'var(--space-2xl)', overflow: 'hidden',
  },
  progressBar: {
    height: '100%', background: 'var(--color-accent)',
    borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  groups: { display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  group: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
  },
  groupHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'var(--space-md) var(--space-lg)',
    background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)',
  },
  groupTitle: {
    fontSize: '0.875rem', fontWeight: 600,
    color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)',
  },
  groupCount: { fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontVariantNumeric: 'tabular-nums' },
  item: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
    padding: 'var(--space-md) var(--space-lg)',
    borderBottom: '1px solid var(--color-border)',
    transition: 'opacity 0.2s',
    cursor: 'pointer',
  },
  checkbox: { flexShrink: 0, display: 'flex', alignItems: 'center' },
  checkboxChecked: {
    width: 20, height: 20, borderRadius: 'var(--radius-sm)',
    background: 'var(--color-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  itemName: { fontSize: '0.9375rem', display: 'block', transition: 'color 0.15s' },
  itemAmount: {
    fontSize: '0.8125rem', color: 'var(--color-text-tertiary)',
    display: 'block', marginTop: 1,
  },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-tertiary)', padding: 'var(--space-xs)',
    display: 'flex', alignItems: 'center', flexShrink: 0,
    opacity: 0.5, transition: 'opacity 0.15s',
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
    fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: 320,
  },
  spinner: {
    width: 28, height: 28,
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
}
