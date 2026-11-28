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

-- Modération du chat : message masqué (signalements ou modérateur) + signalements, un par élève et par message
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.chat_message_reports (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reporter_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS chat_message_reports_unique_idx
  ON public.chat_message_reports (message_id, reporter_user_id);
-- RLS sans politique : table réservée au serveur (aucun accès anon / authenticated)
ALTER TABLE public.chat_message_reports ENABLE ROW LEVEL SECURITY;

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

-- 3. Classement public : opt-in explicite, sous pseudonyme tiré au sort (public mineur).
--    N'expose que rang + pseudonyme + XP : ni nom, ni photo, ni classe, ni identifiant, ni heure d'activité.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pseudonym TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_pseudonym_key ON public.users (pseudonym);

-- Âge minimum (15 ans) confirmé à la première connexion : seule la date de confirmation est gardée,
-- jamais la date de naissance. Règles du chat acceptées avant le premier message.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age_confirmed_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS chat_rules_accepted_at TIMESTAMPTZ;

DROP VIEW IF EXISTS public.public_leaderboard;
CREATE VIEW public.public_leaderboard AS
SELECT
  (ROW_NUMBER() OVER (ORDER BY xp DESC, id ASC))::INTEGER AS rank,
  pseudonym,
  xp
FROM public.users
WHERE leaderboard_opt_in AND pseudonym IS NOT NULL
ORDER BY xp DESC, id ASC
LIMIT 50;

REVOKE ALL ON public.public_leaderboard FROM anon, authenticated;
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
  FOR SELECT USING (hidden_at IS NULL);

DROP POLICY IF EXISTS "chat_messages_insert_own" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_own" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_euleria_user_id());

-- 6. Durcissement sécurité (idempotent)
-- 6a. Contraintes de domaine : bloque les valeurs forgées via l'API REST avec la clé anon
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_values_check;
ALTER TABLE public.users ADD CONSTRAINT users_values_check CHECK (
  char_length(display_name) BETWEEN 1 AND 40
  AND grade_level IN ('6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale')
  AND theme_mode IN ('light', 'dark')
  AND accent_color IN ('indigo', 'emerald', 'amber', 'sky')
  AND layout_density IN ('comfortable', 'compact')
  AND weekly_xp_goal BETWEEN 100 AND 5000
  AND xp >= 0
  AND (avatar_url IS NULL OR (avatar_url LIKE 'https://%' AND char_length(avatar_url) <= 512))
);

ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_len;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_content_len
  CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000);

-- 6b. Privilèges par colonne : xp, streak_days, uid, email, avatar_url, last_active_at
--     ne sont PLUS modifiables directement par le navigateur (RLS ne filtre que les lignes).
REVOKE INSERT, UPDATE ON public.users FROM anon, authenticated;
GRANT INSERT (uid, email, display_name, avatar_url) ON public.users TO authenticated;
GRANT UPDATE (display_name, grade_level, theme_mode, accent_color, layout_density, show_3d_hints, weekly_xp_goal)
  ON public.users TO authenticated;

-- 6c. XP : unique voie d'écriture, plafonnée (+100 max) et limitée à 1 appel / 5 s.
-- ponytail: en mode statique les réponses sont dans le bundle, l'XP reste déclaratif ;
-- ce plafond borne la triche (~1200 XP/min max) — pour l'éliminer, valider côté serveur (server.ts).
CREATE OR REPLACE FUNCTION public.euleria_sync_xp(new_xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result INTEGER;
BEGIN
  UPDATE public.users
     SET xp = LEAST(GREATEST(new_xp, xp), xp + 100),
         last_active_at = NOW()
   WHERE uid = auth.uid()::text
     AND last_active_at < NOW() - INTERVAL '5 seconds'
  RETURNING xp INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.euleria_sync_xp(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.euleria_sync_xp(INTEGER) TO authenticated;
REVOKE ALL ON FUNCTION public.current_euleria_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_euleria_user_id() TO authenticated;
