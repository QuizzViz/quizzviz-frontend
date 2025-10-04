'use client';

import { useEffect, useState } from 'react';
import { useUserType } from '@/contexts/UserTypeContext';

export function UserTypeInitializer({ children }: { children: React.ReactNode }) {
  const { setUserType } = useUserType();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Initialize with the default user type
    setUserType('individual');
  }, [setUserType]);

  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}
