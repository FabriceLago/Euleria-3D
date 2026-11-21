import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

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

export async function getLeaderboard(limit = 25) {
  try {
    return await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        gradeLevel: users.gradeLevel,
        xp: users.xp,
        streakDays: users.streakDays,
        lastActiveAt: users.lastActiveAt,
      })
      .from(users)
      .orderBy(desc(users.xp), desc(users.streakDays))
      .limit(limit);
  } catch (error) {
    console.error('Database error in getLeaderboard:', error);
    throw new Error('Impossible de charger le classement.', { cause: error });
  }
}
