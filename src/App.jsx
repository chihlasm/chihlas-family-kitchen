import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import AddRecipePage from './pages/AddRecipePage'
import ShoppingListPage from './pages/ShoppingListPage'
import FavoritesPage from './pages/FavoritesPage'
import CookModePage from './pages/CookModePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected — all inside the app shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RecipesPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="shopping" element={<ShoppingListPage />} />
            <Route path="recipes/new" element={<AddRecipePage />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="recipes/:id/edit" element={<AddRecipePage />} />
            <Route path="category/:cat" element={<RecipesPage />} />
            <Route path="cook/:id" element={<CookModePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
