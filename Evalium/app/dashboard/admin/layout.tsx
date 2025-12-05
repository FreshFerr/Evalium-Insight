import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}


