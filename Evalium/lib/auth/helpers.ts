import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

/**
 * Get the current authenticated session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  return session.user;
}

/**
 * Require admin role - redirects to dashboard if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }
  
  return user;
}

/**
 * Check if user has admin role
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === UserRole.ADMIN;
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(name?: string | null): string {
  if (!name) return 'U';
  
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}


