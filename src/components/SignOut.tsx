'use client';

import { useClerk } from '@clerk/nextjs';
import Cookies from 'js-cookie';

export function SignOut(props: { children: React.ReactNode }) {
  const { signOut } = useClerk();

  const handleSignOut = () => {
    Cookies.remove('firstName');
    signOut();
  };

  return (
    <button
      className="border-none text-gray-700 hover:text-gray-900"
      type="button"
      onClick={handleSignOut}
    >
      {props.children}
    </button>
  );
}
