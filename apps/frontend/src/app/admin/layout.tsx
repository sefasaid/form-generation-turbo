'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, removeToken, getUser } from '@repo/nextFetch';
import Link from 'next/link';
import { User } from '../_types';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated() && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [router, pathname]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated()) {
    return null;
  }

  const handleLogout = () => {
    removeToken();
    router.push('/admin/login');
  };

  const user = getUser() as User;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 text-base w-full">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-card-dark border-r border-slate-200 dark:border-slate-700 min-h-screen flex flex-col">
          <div className="p-6 flex-1">
            <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-slate-100">Admin Panel</h2>
            <nav className="space-y-2">
              <Link
                href="/admin"
                className={`block px-4 py-3 rounded-lg transition-colors ${pathname === '/admin'
                  ? 'bg-primary text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                Forms
              </Link>
              <Link
                href="/admin/sessions"
                className={`block px-4 py-3 rounded-lg transition-colors ${pathname === '/admin/sessions'
                  ? 'bg-primary text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                Answers
              </Link>
            </nav>
          </div>
          <div className="p-6 border-t border-slate-200 dark:border-slate-700">
            {!!user && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 text-slate-900 dark:text-slate-100">
                {user.username}
              </p>
            )}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-900 dark:text-slate-100"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-background-light dark:bg-background-dark">{children}</main>
      </div>
    </div>
  );
}
