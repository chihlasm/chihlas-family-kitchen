-- ============================================================
-- Family Kitchen — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- Auto-created when a user signs up via auth trigger
-- ============================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz default now()
);

-- Trigger: auto-insert profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. RECIPES
-- ============================================================

create table if not exists public.recipes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  title               text not null,
  description         text,
  category            text check (category in ('Breakfast','Mains','Sides','Desserts','Soups','Sauces','Drinks')),
  servings            int,
  prep_time_minutes   int,
  cook_time_minutes   int,
  is_family_original  boolean default false,
  family_note         text,
  image_url           text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_recipes_updated_at on public.recipes;
create trigger set_recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.handle_updated_at();


-- ============================================================
-- 3. INGREDIENTS
-- ============================================================

create table if not exists public.ingredients (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references public.recipes(id) on delete cascade,
  sort_order  int not null default 0,
  amount      text,
  unit        text,
  name        text not null,
  created_at  timestamptz default now()
);


-- ============================================================
-- 4. STEPS
-- ============================================================

create table if not exists public.steps (
  id              uuid primary key default gen_random_uuid(),
  recipe_id       uuid not null references public.recipes(id) on delete cascade,
  step_number     int not null,
  instruction     text not null,
  timer_minutes   int,
  created_at      timestamptz default now()
);


-- ============================================================
-- 5. FAVORITES
-- ============================================================

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  recipe_id   uuid not null references public.recipes(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (user_id, recipe_id)
);


-- ============================================================
-- 6. SHOPPING LIST
-- ============================================================

create table if not exists public.shopping_list (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  recipe_id       uuid references public.recipes(id) on delete set null,
  ingredient_id   uuid references public.ingredients(id) on delete set null,
  name            text not null,
  amount          text,
  unit            text,
  checked         boolean default false,
  created_at      timestamptz default now(),
  unique (user_id, ingredient_id)
);


-- ============================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles      enable row level security;
alter table public.recipes       enable row level security;
alter table public.ingredients   enable row level security;
alter table public.steps         enable row level security;
alter table public.favorites     enable row level security;
alter table public.shopping_list enable row level security;


-- PROFILES
-- Anyone logged in can read all profiles (needed for "by [name]" display)
create policy "profiles: authenticated users can read"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "profiles: users update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);


-- RECIPES
-- All authenticated users can read all recipes (family sharing)
create policy "recipes: authenticated users can read all"
  on public.recipes for select
  to authenticated
  using (true);

-- Only the creator can insert
create policy "recipes: creator can insert"
  on public.recipes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Only the creator can update
create policy "recipes: creator can update"
  on public.recipes for update
  to authenticated
  using (auth.uid() = user_id);

-- Only the creator can delete
create policy "recipes: creator can delete"
  on public.recipes for delete
  to authenticated
  using (auth.uid() = user_id);


-- INGREDIENTS
-- Readable by anyone logged in
create policy "ingredients: authenticated users can read"
  on public.ingredients for select
  to authenticated
  using (true);

-- Only the recipe owner can insert/update/delete ingredients
create policy "ingredients: recipe owner can insert"
  on public.ingredients for insert
  to authenticated
  with check (
    exists (
      select 1 from public.recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );

create policy "ingredients: recipe owner can update"
  on public.ingredients for update
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );

create policy "ingredients: recipe owner can delete"
  on public.ingredients for delete
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );


-- STEPS
-- Same pattern as ingredients
create policy "steps: authenticated users can read"
  on public.steps for select
  to authenticated
  using (true);

create policy "steps: recipe owner can insert"
  on public.steps for insert
  to authenticated
  with check (
    exists (
      select 1 from public.recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );

create policy "steps: recipe owner can update"
  on public.steps for update
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );

create policy "steps: recipe owner can delete"
  on public.steps for delete
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where id = recipe_id and user_id = auth.uid()
    )
  );


-- FAVORITES
-- Users can only see and manage their own favorites
create policy "favorites: users manage own"
  on public.favorites for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- SHOPPING LIST
-- Users can only see and manage their own shopping list
create policy "shopping_list: users manage own"
  on public.shopping_list for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- 8. PERFORMANCE INDEXES
-- ============================================================

create index if not exists idx_recipes_user_id       on public.recipes(user_id);
create index if not exists idx_recipes_category      on public.recipes(category);
create index if not exists idx_ingredients_recipe_id on public.ingredients(recipe_id);
create index if not exists idx_steps_recipe_id       on public.steps(recipe_id);
create index if not exists idx_favorites_user_id     on public.favorites(user_id);
create index if not exists idx_favorites_recipe_id   on public.favorites(recipe_id);
create index if not exists idx_shopping_user_id      on public.shopping_list(user_id);
