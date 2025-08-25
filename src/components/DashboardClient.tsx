'use client';

import { useUser } from '@clerk/nextjs';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

import { Hello } from '@/components/Hello';

export function DashboardClient() {
  const { user } = useUser();

  useEffect(() => {
    if (user?.firstName) {
      Cookies.set('firstName', user.firstName, { expires: 365 });
    }
  }, [user]);

  return (
    <div className="py-5 [&_p]:my-6">
      <Hello />
    </div>
  );
}
