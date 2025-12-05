'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  FileText,
  Settings,
  Users,
  Shield,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Le mie aziende',
    href: '/dashboard/companies',
    icon: Building2,
  },
  {
    title: 'Report',
    href: '/dashboard/reports',
    icon: FileText,
  },
  {
    title: 'Impostazioni',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

const adminItems: NavItem[] = [
  {
    title: 'Lead M&A',
    href: '/dashboard/admin/leads',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Admin',
    href: '/dashboard/admin',
    icon: Shield,
    adminOnly: true,
  },
];

interface DashboardNavProps {
  userRole: string;
}

export function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'ADMIN';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-white lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-bold text-evalium-700"
        >
          <Image
            src="/logo.png"
            alt="Evalium"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span>Evalium</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-evalium-50 text-evalium-700'
                  : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="my-4 border-t" />
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amministrazione
            </p>
            {adminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-evalium-50 text-evalium-700'
                      : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-evalium-50 p-4">
          <p className="text-sm font-medium text-evalium-900">
            Hai bisogno di aiuto?
          </p>
          <p className="mt-1 text-xs text-evalium-700">
            Contattaci a{' '}
            <a
              href="mailto:info.aivaluation@gmail.com"
              className="underline hover:no-underline"
            >
              info.aivaluation@gmail.com
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}


