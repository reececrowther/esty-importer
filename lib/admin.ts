import type { Session } from 'next-auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();

export function isAdmin(session: Session | null): boolean {
  if (!session?.user?.email || !ADMIN_EMAIL) return false;
  return session.user.email.toLowerCase() === ADMIN_EMAIL;
}

export function getAdminEmail(): string | undefined {
  return ADMIN_EMAIL || undefined;
}
