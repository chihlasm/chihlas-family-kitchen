import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  BookOpen, ShoppingCart, ChefHat, Star, LogOut,
  Plus, Menu, X, Utensils
} from 'lucide-react'

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
    { to: '/', label: 'All Recipes', icon: BookOpen, end: true },
    { to: '/favorites', label: 'Favorites', icon: Star },
    { to: '/shopping', label: 'Shopping List', icon: ShoppingCart },
  ]

  const categories = [
    'Breakfast', 'Mains', 'Sides', 'Desserts', 'Soups', 'Sauces', 'Drinks'
  ]

  return (
    <div style={styles.shell}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, transform: mobileOpen ? 'translateX(0)' : undefined }}>
        {/* Logo */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logoMark}>
            <Utensils size={16} color="#c85c2d" />
          </div>
          <span style={styles.logoText}>Chihlas Family Kitchen</span>
          <button style={styles.closeBtn} onClick={() => setMobileOpen(false)}>
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        {/* Add Recipe CTA */}
        <div style={styles.sidebarSection}>
          <button style={styles.addBtn} onClick={() => navigate('/recipes/new')}>
            <Plus size={16} />
            Add Recipe
          </button>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          <span style={styles.navLabel}>Library</span>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          <span style={{ ...styles.navLabel, marginTop: '1.25rem' }}>Categories</span>
          {categories.map(cat => (
            <NavLink
              key={cat}
              to={`/category/${cat.toLowerCase()}`}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...styles.navItemSub,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              {cat}
            </NavLink>
          ))}

          <span style={{ ...styles.navLabel, marginTop: '1.25rem' }}>Cook</span>
          <NavLink
            to="/cook"
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <ChefHat size={16} />
            Cook Mode
          </NavLink>
        </nav>

        {/* User footer */}
        <div style={styles.userFooter}>
          <div style={styles.avatar}>{initials}</div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{displayName}</span>
            <span style={styles.userEmail}>{user?.email}</span>
          </div>
          <button style={styles.signOutBtn} onClick={handleSignOut} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={styles.main}>
        {/* Mobile topbar */}
        <div style={styles.mobileTopbar}>
          <button style={styles.menuBtn} onClick={() => setMobileOpen(true)}>
            <Menu size={20} color="var(--color-text-primary)" />
          </button>
          <span style={styles.mobileTitle}>Chihlas Family Kitchen</span>
          <button style={styles.addBtnMobile} onClick={() => navigate('/recipes/new')}>
            <Plus size={18} color="var(--color-accent)" />
          </button>
        </div>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const styles = {
  shell: {
    display: 'flex',
    width: '100%',
    minHeight: '100vh',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 40,
    display: 'none',
    '@media (max-width: 768px)': { display: 'block' },
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    minHeight: '100vh',
    background: 'var(--color-sidebar-bg)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '1.25rem 1rem 0.875rem',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: 'rgba(200,92,45,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    color: '#ffffff',
    fontWeight: 500,
    flex: 1,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'none',
    padding: 4,
  },
  sidebarSection: {
    padding: '0.875rem 0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  addBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5625rem 1rem',
    background: 'var(--color-accent)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'background 0.15s',
  },
  nav: {
    flex: 1,
    padding: '0.875rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflowY: 'auto',
  },
  navLabel: {
    display: 'block',
    fontSize: '0.6875rem',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    padding: '0 0.5rem',
    marginBottom: '4px',
    marginTop: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.625rem',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-sidebar-text)',
    fontSize: '0.875rem',
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
    cursor: 'pointer',
  },
  navItemSub: {
    paddingLeft: '1.625rem',
    fontSize: '0.8125rem',
  },
  navItemActive: {
    background: 'var(--color-sidebar-active)',
    color: '#ffffff',
  },
  userFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.875rem 1rem',
    borderTop: '1px solid rgba(255,255,255,0.07)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(200,92,45,0.3)',
    color: '#c85c2d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    flexShrink: 0,
    border: '1px solid rgba(200,92,45,0.4)',
  },
  userInfo: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  userName: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '0.6875rem',
    color: 'rgba(255,255,255,0.4)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  signOutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 6,
    color: 'rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  mobileTopbar: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  mobileTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.0625rem',
    fontWeight: 500,
  },
  addBtnMobile: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: '2rem',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
}
