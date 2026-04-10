# Family Kitchen

A private family recipe book with shopping list and interactive cook mode.

---

## Tech Stack

- **Frontend**: React + Vite
- **Database + Auth**: Supabase (PostgreSQL)
- **Hosting**: Vercel

---

## Setup Instructions

### 1. Run the database schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click **Run**

You should see "Success. No rows returned."

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173

### 4. Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to vercel.com → New Project → Import your GitHub repo
3. Add these environment variables in Vercel:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click Deploy

---

## Project Structure

```
src/
  components/
    auth/         # ProtectedRoute
    layout/       # AppLayout (sidebar + shell)
  hooks/
    useAuth.jsx   # Auth context + session management
  lib/
    supabase.js   # Supabase client
  pages/
    AuthPage.jsx          # Sign in / Sign up
    RecipesPage.jsx       # Recipe grid / home
    RecipeDetailPage.jsx  # View a recipe
    AddRecipePage.jsx     # Add / edit a recipe
    ShoppingListPage.jsx  # Shopping list
    FavoritesPage.jsx     # Saved favorites
    CookModePage.jsx      # Step-by-step cook mode with timers
  styles/
    global.css    # Design tokens + global styles
  App.jsx         # Router
  main.jsx        # Entry point
```

---

## Features

- Email + password authentication
- Family recipe library with categories
- Add recipes with ingredients and step-by-step instructions
- Per-step cooking timers in cook mode
- Shopping list generated from any recipe, grouped by recipe
- Favorite recipes
- "Family original" tagging with family notes
- Row Level Security — all data protected at the database level
