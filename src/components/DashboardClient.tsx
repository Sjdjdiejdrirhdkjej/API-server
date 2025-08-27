'use client';

import type { ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

export function DashboardClient({ children }: { children: ReactNode }) {
  const { user } = useUser();

  useEffect(() => {
    if (user?.firstName) {
      Cookies.set('firstName', user.firstName, { expires: 365 });
    }
  }, [user]);

  return <div className="py-5 [&_p]:my-6">{children}</div>;
}
