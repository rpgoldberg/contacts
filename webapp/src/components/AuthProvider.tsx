'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, clearCredentials } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!isPublicPath && !isAuthenticated()) {
      router.replace('/login');
    } else if (pathname === '/login' && isAuthenticated()) {
      router.replace('/');
    } else {
      setChecking(false);
    }
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return <>{children}</>;
}

export function useLogout() {
  const router = useRouter();

  return () => {
    clearCredentials();
    router.push('/login');
  };
}
