import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from './index.ts';
import { makePseudonym, toPublicLeaderboard, type PublicLeaderboardEntry } from './leaderboard.ts';
import { users } from './schema.ts';

export type { PublicLeaderboardEntry };

function sanitizeAvatarUrl(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol === 'https:') {
      return parsed.toString().slice(0, 512);
    }
  } catch {
    // Ignore malformed URLs
  }
  return null;
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  avatarUrl?: string
) {
  try {
    const safeName =
      displayName && displayName.trim().length > 0
        ? displayName.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 40) || 'Élève'
        : email.split('@')[0] || 'Élève';
    const safeAvatar = sanitizeAvatarUrl(avatarUrl);

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: safeName,
        avatarUrl: safeAvatar,
        lastActiveAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          lastActiveAt: new Date(),
          ...(safeAvatar ? { avatarUrl: safeAvatar } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Impossible de synchroniser le profil utilisateur.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database error in getUserByUid:', error);
    throw new Error('Impossible de charger le profil utilisateur.', { cause: error });
  }
}

export async function updateUserPreferences(
  uid: string,
  updates: Partial<{
    displayName: string;
    gradeLevel: string;
    themeMode: string;
    accentColor: string;
    layoutDensity: string;
    show3DHints: boolean;
    weeklyXpGoal: number;
  }>
) {
  try {
    const rows = await db
      .update(users)
      .set({
        ...updates,
        lastActiveAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return rows[0] || null;
  } catch (error) {
    console.error('Database error in updateUserPreferences:', error);
    throw new Error('Impossible de mettre à jour les préférences.', { cause: error });
  }
}

/** Classement public : uniquement les élèves qui l'ont activé, sous pseudonyme (rang + pseudonyme + XP). */
export async function getLeaderboard(limit = 25): Promise<PublicLeaderboardEntry[]> {
  try {
    const rows = await db
      .select({ pseudonym: users.pseudonym, xp: users.xp })
      .from(users)
      .where(and(eq(users.leaderboardOptIn, true), isNotNull(users.pseudonym)))
      .orderBy(desc(users.xp), asc(users.id))
      .limit(limit);
    return toPublicLeaderboard(rows);
  } catch (error) {
    console.error('Database error in getLeaderboard:', error);
    throw new Error('Impossible de charger le classement.', { cause: error });
  }
}

const isUniqueViolation = (error: unknown) => {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
};

/**
 * Active / désactive l'apparition dans le classement.
 * Un pseudonyme est tiré au sort à la première activation, puis conservé (il ne dit rien de l'élève).
 */
export async function setLeaderboardOptIn(uid: string, optIn: boolean) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = await getUserByUid(uid);
    if (!current) return null;
    const newPseudonym = optIn && !current.pseudonym ? makePseudonym() : null;
    try {
      const rows = await db
        .update(users)
        .set({ leaderboardOptIn: optIn, ...(newPseudonym ? { pseudonym: newPseudonym } : {}) })
        .where(eq(users.uid, uid))
        .returning();
      return rows[0] || null;
    } catch (error) {
      if (newPseudonym && isUniqueViolation(error)) continue; // pseudonyme déjà pris : on en tire un autre
      console.error('Database error in setLeaderboardOptIn:', error);
      throw new Error('Impossible de mettre à jour le classement.', { cause: error });
    }
  }
  throw new Error('Impossible d’attribuer un pseudonyme, réessaie.');
}
