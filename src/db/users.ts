import { and, asc, desc, eq, isNotNull, isNull } from 'drizzle-orm';
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

    // Identité publique (chat, présence, duels, classement) : toujours le pseudonyme, jamais le nom réel
    return result[0]?.pseudonym ? result[0] : await assignPseudonymIfMissing(uid);
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

/** Tire au sort un pseudonyme unique pour l'élève s'il n'en a pas encore (conservé ensuite). */
async function assignPseudonymIfMissing(uid: string) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const rows = await db
        .update(users)
        .set({ pseudonym: makePseudonym() })
        .where(and(eq(users.uid, uid), isNull(users.pseudonym)))
        .returning();
      return rows[0] ?? (await getUserByUid(uid)); // déjà attribué entre-temps : on relit
    } catch (error) {
      if (isUniqueViolation(error)) continue; // pseudonyme déjà pris : on en tire un autre
      throw error;
    }
  }
  throw new Error('Impossible d’attribuer un pseudonyme, réessaie.');
}

/** Active / désactive l'apparition dans le classement (sous le pseudonyme de l'élève). */
export async function setLeaderboardOptIn(uid: string, optIn: boolean) {
  try {
    await assignPseudonymIfMissing(uid);
    const rows = await db.update(users).set({ leaderboardOptIn: optIn }).where(eq(users.uid, uid)).returning();
    return rows[0] || null;
  } catch (error) {
    console.error('Database error in setLeaderboardOptIn:', error);
    throw new Error('Impossible de mettre à jour le classement.', { cause: error });
  }
}
