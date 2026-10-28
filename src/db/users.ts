import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, role: string = 'student', roll?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        role,
        roll,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          ...(roll ? { roll } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw new Error('Database user sync failed', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const found = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return found[0] || null;
  } catch (error) {
    console.error('Failed to query user by UID:', error);
    throw new Error('Database query failed', { cause: error });
  }
}
