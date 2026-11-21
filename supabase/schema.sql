-- Euleria 3D — Schéma PostgreSQL complet pour Supabase (aligné sur src/db/schema.ts)
-- Exécutez ce script dans : Supabase Dashboard → SQL Editor → New query → Run

-- 1. Tables principales
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Élève',
  avatar_url TEXT,
  grade_level TEXT NOT NULL DEFAULT '6e',
  xp INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 1,
  theme_mode TEXT NOT NULL DEFAULT 'light',
  accent_color TEXT NOT NULL DEFAULT 'indigo',
  layout_density TEXT NOT NULL DEFAULT 'comfortable',
  show_3d_hints BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_xp_goal INTEGER NOT NULL DEFAULT 400,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chapters (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL DEFAULT 'mathematics',
  grade_level TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  summary TEXT NOT NULL,
  theory_content TEXT NOT NULL,
  formula_display TEXT NOT NULL,
  scene_preset TEXT NOT NULL,
  default_params_json TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 120,
  estimated_minutes INTEGER NOT NULL DEFAULT 20
);

CREATE TABLE IF NOT EXISTS public.exercises (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  hint TEXT NOT NULL,
  options_json TEXT,
  correct_answer TEXT NOT NULL,
  numeric_tolerance REAL DEFAULT 0.05,
  explanation TEXT NOT NULL,
  xp_value INTEGER NOT NULL DEFAULT 35
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL,
  completed_exercises_count INTEGER NOT NULL DEFAULT 0,
  total_exercises_count INTEGER NOT NULL DEFAULT 3,
  mastery_score REAL NOT NULL DEFAULT 0,
  predicted_success_rate REAL NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'not_started',
  last_practiced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT user_progress_user_chapter_unique UNIQUE (user_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL DEFAULT 5000,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badges (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  xp_threshold INTEGER NOT NULL DEFAULT 0,
  condition_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_badges_user_badge_unique UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.study_rooms (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  shared_chapter_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_slug TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  grade_label TEXT NOT NULL,
  score_on_20 REAL NOT NULL,
  correct_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  mention TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  subject_breakdown_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL,
  card_key TEXT NOT NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  last_rating TEXT NOT NULL DEFAULT 'good',
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT flashcard_reviews_user_chapter_card_unique UNIQUE (user_id, chapter_id, card_key)
);

-- 2. Salons d'entraide par défaut (idempotent)
INSERT INTO public.study_rooms (slug, name, grade_level, topic) VALUES
  ('entraide-college', 'Entraide Collège (6e - 3e)', 'Collège', 'Fractions, géométrie, Brevet, SVT & Histoire-Géo'),
  ('entraide-lycee', 'Entraide Lycée (2nde - Term)', 'Lycée', 'Fonctions, dérivées, Physique-Chimie, Philo & Bac'),
  ('atelier-3d', 'Atelier Modélisation 3D', 'Tous niveaux', 'Partage de scènes WebGL et visualisations scientifiques')
ON CONFLICT (slug) DO NOTHING;

-- 3. Vue publique sécurisée pour le classement (n'expose jamais les adresses e-mail)
CREATE OR REPLACE VIEW public.public_leaderboard AS
SELECT
  id,
  display_name,
  avatar_url,
  grade_level,
  xp,
  streak_days,
  last_active_at
FROM public.users
ORDER BY xp DESC, last_active_at DESC
LIMIT 50;

GRANT SELECT ON public.public_leaderboard TO anon, authenticated;

-- 4. Fonction utilitaire d'identité pour les politiques RLS
CREATE OR REPLACE FUNCTION public.current_euleria_user_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE uid = auth.uid()::text LIMIT 1;
$$;

-- 5. Activation de la sécurité au niveau des lignes (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- Politiques : Catalogue public en lecture seule
DROP POLICY IF EXISTS "chapters_read_all" ON public.chapters;
CREATE POLICY "chapters_read_all" ON public.chapters FOR SELECT USING (true);

DROP POLICY IF EXISTS "badges_read_all" ON public.badges;
CREATE POLICY "badges_read_all" ON public.badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "study_rooms_read_all" ON public.study_rooms;
CREATE POLICY "study_rooms_read_all" ON public.study_rooms FOR SELECT USING (true);

-- Politiques : Utilisateurs (accès strictement limité à son propre profil)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (uid = auth.uid()::text);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (uid = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (uid = auth.uid()::text)
  WITH CHECK (uid = auth.uid()::text);

-- Politiques : Progression, tentatives, examens, flashcards & badges personnels
DROP POLICY IF EXISTS "user_progress_own" ON public.user_progress;
CREATE POLICY "user_progress_own" ON public.user_progress
  FOR ALL TO authenticated
  USING (user_id = public.current_euleria_user_id())
  WITH CHECK (user_id = public.current_euleria_user_id());

DROP POLICY IF EXISTS "quiz_attempts_own" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_own" ON public.quiz_attempts
  FOR ALL TO authenticated
  USING (user_id = public.current_euleria_user_id())
  WITH CHECK (user_id = public.current_euleria_user_id());

DROP POLICY IF EXISTS "user_badges_own" ON public.user_badges;
CREATE POLICY "user_badges_own" ON public.user_badges
  FOR SELECT TO authenticated
  USING (user_id = public.current_euleria_user_id());

DROP POLICY IF EXISTS "exam_sessions_own" ON public.exam_sessions;
CREATE POLICY "exam_sessions_own" ON public.exam_sessions
  FOR ALL TO authenticated
  USING (user_id = public.current_euleria_user_id())
  WITH CHECK (user_id = public.current_euleria_user_id());

DROP POLICY IF EXISTS "flashcard_reviews_own" ON public.flashcard_reviews;
CREATE POLICY "flashcard_reviews_own" ON public.flashcard_reviews
  FOR ALL TO authenticated
  USING (user_id = public.current_euleria_user_id())
  WITH CHECK (user_id = public.current_euleria_user_id());

-- Politiques : Messages d'entraide (lecture publique, écriture authentifiée pour soi-même)
DROP POLICY IF EXISTS "chat_messages_read_all" ON public.chat_messages;
CREATE POLICY "chat_messages_read_all" ON public.chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_messages_insert_own" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_own" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_euleria_user_id());
