import { createClient, type SupabaseClient, type User as SupabaseAuthUser } from '@supabase/supabase-js';
import type {
  AccentColor,
  ChapterProgress,
  ChatMessageItem,
  GradeLevel,
  LayoutDensity,
  LeaderboardEntry,
  StudyRoom,
  ThemeMode,
  UserProfile,
} from '../types/learning.ts';

const RAW_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const RAW_SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

function isValidHttpUrl(raw: string): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured =
  isValidHttpUrl(RAW_SUPABASE_URL) && RAW_SUPABASE_ANON_KEY.length >= 20;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(RAW_SUPABASE_URL, RAW_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const VALID_GRADES = new Set<GradeLevel>(['6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale']);
const VALID_THEMES = new Set<ThemeMode>(['light', 'dark']);
const VALID_ACCENTS = new Set<AccentColor>(['indigo', 'emerald', 'amber', 'sky']);
const VALID_DENSITIES = new Set<LayoutDensity>(['comfortable', 'compact']);

interface DbUserRow {
  id: number;
  uid: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  grade_level: string;
  xp: number;
  streak_days: number;
  theme_mode: string;
  accent_color: string;
  layout_density: string;
  show_3d_hints: boolean;
  weekly_xp_goal: number;
  last_active_at: string;
}

function mapUserRow(row: DbUserRow): UserProfile {
  return {
    id: row.id,
    uid: row.uid,
    email: row.email,
    displayName: row.display_name || 'Élève',
    avatarUrl: row.avatar_url || null,
    gradeLevel: VALID_GRADES.has(row.grade_level as GradeLevel)
      ? (row.grade_level as GradeLevel)
      : '6e',
    xp: Number(row.xp) || 0,
    streakDays: Number(row.streak_days) || 1,
    themeMode: VALID_THEMES.has(row.theme_mode as ThemeMode)
      ? (row.theme_mode as ThemeMode)
      : 'light',
    accentColor: VALID_ACCENTS.has(row.accent_color as AccentColor)
      ? (row.accent_color as AccentColor)
      : 'indigo',
    layoutDensity: VALID_DENSITIES.has(row.layout_density as LayoutDensity)
      ? (row.layout_density as LayoutDensity)
      : 'comfortable',
    show3DHints: Boolean(row.show_3d_hints),
    weeklyXpGoal: Number(row.weekly_xp_goal) || 400,
  };
}

export async function ensureSupabaseUserProfile(
  authUser: SupabaseAuthUser
): Promise<UserProfile | null> {
  if (!supabase) return null;

  const fallbackName =
    (authUser.user_metadata?.full_name as string | undefined) ||
    (authUser.user_metadata?.name as string | undefined) ||
    authUser.email?.split('@')[0] ||
    'Élève';
  const avatarUrl =
    (authUser.user_metadata?.avatar_url as string | undefined) ||
    (authUser.user_metadata?.picture as string | undefined) ||
    null;

  const { data: existing, error: selectErr } = await supabase
    .from('users')
    .select('*')
    .eq('uid', authUser.id)
    .maybeSingle<DbUserRow>();

  if (!selectErr && existing) {
    return mapUserRow(existing);
  }

  // INSERT ... ON CONFLICT DO NOTHING : n'exige pas le droit UPDATE sur uid/email/avatar_url
  await supabase.from('users').upsert(
    {
      uid: authUser.id,
      email: authUser.email || `${authUser.id}@euleria.local`,
      display_name: fallbackName.trim().slice(0, 40) || 'Élève',
      avatar_url: avatarUrl && avatarUrl.startsWith('https://') ? avatarUrl.slice(0, 512) : null,
    },
    { onConflict: 'uid', ignoreDuplicates: true }
  );

  const { data: inserted, error: upsertErr } = await supabase
    .from('users')
    .select('*')
    .eq('uid', authUser.id)
    .single<DbUserRow>();

  if (upsertErr || !inserted) {
    console.error('Supabase user profile sync error:', upsertErr);
    return null;
  }

  return mapUserRow(inserted);
}

export async function fetchSupabaseUserProgress(userId: number): Promise<ChapterProgress[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row) => ({
    id: Number(row.id),
    userId: Number(row.user_id),
    chapterId: Number(row.chapter_id),
    completedExercisesCount: Number(row.completed_exercises_count) || 0,
    totalExercisesCount: Number(row.total_exercises_count) || 3,
    masteryScore: Number(row.mastery_score) || 0,
    predictedSuccessRate: Number(row.predicted_success_rate) || 50,
    status:
      row.status === 'completed' || row.status === 'in_progress'
        ? row.status
        : 'not_started',
    lastPracticedAt: String(row.last_practiced_at || new Date().toISOString()),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  }));
}

export async function upsertSupabaseChapterProgress(
  userId: number,
  prog: ChapterProgress,
  newXp: number
): Promise<void> {
  if (!supabase) return;
  const nowIso = new Date().toISOString();

  await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      chapter_id: prog.chapterId,
      completed_exercises_count: Math.max(0, Math.round(prog.completedExercisesCount)),
      total_exercises_count: Math.max(1, Math.round(prog.totalExercisesCount)),
      mastery_score: Math.max(0, Math.min(100, prog.masteryScore)),
      predicted_success_rate: Math.max(0, Math.min(100, prog.predictedSuccessRate)),
      status: prog.status,
      last_practiced_at: nowIso,
      completed_at: prog.completedAt,
    },
    { onConflict: 'user_id,chapter_id' }
  );

  if (Number.isFinite(newXp) && newXp >= 0) {
    // L'XP ne s'écrit plus en direct : RPC plafonnée côté base (voir supabase/schema.sql §6c)
    await supabase.rpc('euleria_sync_xp', { new_xp: Math.round(newXp) });
  }
}

export async function updateSupabasePreferences(
  uid: string,
  prefs: {
    displayName?: string;
    gradeLevel?: GradeLevel;
    themeMode?: ThemeMode;
    accentColor?: AccentColor;
    layoutDensity?: LayoutDensity;
    show3DHints?: boolean;
    weeklyXpGoal?: number;
  }
): Promise<UserProfile | null> {
  if (!supabase) return null;

  // last_active_at n'est plus modifiable par le client (il sert au rate-limit de l'XP)
  const patch: Record<string, unknown> = {};
  if (typeof prefs.displayName === 'string' && prefs.displayName.trim()) {
    patch.display_name = prefs.displayName.trim().slice(0, 40);
  }
  if (prefs.gradeLevel && VALID_GRADES.has(prefs.gradeLevel)) {
    patch.grade_level = prefs.gradeLevel;
  }
  if (prefs.themeMode && VALID_THEMES.has(prefs.themeMode)) {
    patch.theme_mode = prefs.themeMode;
  }
  if (prefs.accentColor && VALID_ACCENTS.has(prefs.accentColor)) {
    patch.accent_color = prefs.accentColor;
  }
  if (prefs.layoutDensity && VALID_DENSITIES.has(prefs.layoutDensity)) {
    patch.layout_density = prefs.layoutDensity;
  }
  if (typeof prefs.show3DHints === 'boolean') {
    patch.show_3d_hints = prefs.show3DHints;
  }
  if (typeof prefs.weeklyXpGoal === 'number' && Number.isFinite(prefs.weeklyXpGoal)) {
    patch.weekly_xp_goal = Math.max(100, Math.min(5000, Math.round(prefs.weeklyXpGoal)));
  }

  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('uid', uid)
    .select('*')
    .maybeSingle<DbUserRow>();

  if (error || !data) {
    console.error('Supabase preferences update error:', error);
    return null;
  }

  return mapUserRow(data);
}

export async function fetchSupabaseLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  // Vue publique : uniquement les élèves volontaires, sous pseudonyme (voir supabase/schema.sql)
  const { data, error } = await supabase
    .from('public_leaderboard')
    .select('rank, pseudonym, xp')
    .limit(Math.max(1, Math.min(50, limit)));

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row) => ({
    rank: Number(row.rank),
    pseudonym: String(row.pseudonym),
    xp: Number(row.xp) || 0,
  }));
}

export async function fetchSupabaseRoomsAndMessages(roomSlug: string): Promise<{
  rooms: StudyRoom[];
  messages: ChatMessageItem[];
}> {
  if (!supabase) return { rooms: [], messages: [] };

  const { data: roomRows } = await supabase
    .from('study_rooms')
    .select('id, slug, name, grade_level, topic')
    .order('id', { ascending: true });

  const rooms: StudyRoom[] = Array.isArray(roomRows)
    ? roomRows.map((r) => ({
        id: Number(r.id),
        slug: String(r.slug),
        name: String(r.name),
        gradeLevel: String(r.grade_level),
        topic: String(r.topic),
      }))
    : [];

  const activeRoom = rooms.find((r) => r.slug === roomSlug) || rooms[0];
  if (!activeRoom) {
    return { rooms, messages: [] };
  }

  const { data: msgRows } = await supabase
    .from('chat_messages')
    .select('id, room_id, user_id, content, shared_chapter_id, created_at')
    .eq('room_id', activeRoom.id)
    .order('created_at', { ascending: true })
    .limit(50);

  if (!Array.isArray(msgRows) || msgRows.length === 0) {
    return { rooms, messages: [] };
  }

  // Le classement public ne contient plus d'identité : en mode de repli, les auteurs restent anonymes
  const messages: ChatMessageItem[] = msgRows.map((m) => ({
    id: Number(m.id),
    roomId: Number(m.room_id),
    roomSlug: activeRoom.slug,
    content: String(m.content),
    sharedChapterId: m.shared_chapter_id ? Number(m.shared_chapter_id) : null,
    createdAt: String(m.created_at),
    authorName: 'Élève',
  }));

  return { rooms, messages };
}

export async function sendSupabaseChatMessage(opts: {
  roomId: number;
  roomSlug: string;
  author: UserProfile;
  content: string;
  sharedChapterId: number | null;
}): Promise<ChatMessageItem | null> {
  if (!supabase) return null;
  const clean = opts.content.trim().slice(0, 1000);
  if (!clean) return null;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: opts.roomId,
      user_id: opts.author.id,
      content: clean,
      shared_chapter_id: opts.sharedChapterId,
    })
    .select('id, room_id, user_id, content, shared_chapter_id, created_at')
    .single();

  if (error || !data) {
    console.error('Supabase send chat error:', error);
    return null;
  }

  return {
    id: Number(data.id),
    roomId: Number(data.room_id),
    roomSlug: opts.roomSlug,
    content: String(data.content),
    sharedChapterId: data.shared_chapter_id ? Number(data.shared_chapter_id) : null,
    createdAt: String(data.created_at),
    authorName: opts.author.pseudonym || 'Élève',
  };
}
