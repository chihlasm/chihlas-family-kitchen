import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  BookOpen, ShoppingCart, Star, LogOut,
  Plus, Menu, X
} from 'lucide-react'

const CATEGORIES = [
  'Breakfast', 'Mains', 'Sides', 'Desserts', 'Soups', 'Sauces', 'Drinks'
]

export default function AppLayout() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Family'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  const navItems = [
    { to: '/', label: 'Recipes', icon: BookOpen, end: true },
    { to: '/favorites', label: 'Favorites', icon: Star },
    { to: '/shopping', label: 'Shopping', icon: ShoppingCart },
  ]

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`app-sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">Chihlas Family Kitchen</span>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-cta">
          <button className="btn-primary btn-full" onClick={() => { navigate('/recipes/new'); setMobileOpen(false) }}>
            <Plus size={16} /> Add Recipe
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Library</span>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}

          <span className="nav-label" style={{ marginTop: 'var(--space-xl)' }}>Categories</span>
          {CATEGORIES.map(cat => (
            <NavLink
              key={cat}
              to={`/category/${cat.toLowerCase()}`}
              className={({ isActive }) => `nav-sub${isActive ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {cat}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="sign-out-btn" onClick={handleSignOut} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="app-main">
        <div className="mobile-header">
          <button className="icon-btn" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="mobile-logo">Chihlas Family Kitchen</span>
          <button className="icon-btn" onClick={() => navigate('/recipes/new')}>
            <Plus size={20} style={{ color: 'var(--color-accent)' }} />
          </button>
        </div>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="bottom-nav">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
