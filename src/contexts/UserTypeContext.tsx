"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserType = 'individual' | 'business';

type UserTypeContextType = {
  userType: UserType;
  setUserType: (type: UserType) => void;
  isInitialized: boolean;
};

const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

export const UserTypeProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserType] = useState<UserType>('individual');
  const [isInitialized, setIsInitialized] = useState(false);

  // This effect ensures we're on the client before initializing
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Only provide the context after client-side hydration
  if (!isInitialized) {
    return <>{children}</>;
  }

  return (
    <UserTypeContext.Provider value={{ userType, setUserType, isInitialized }}>
      {children}
    </UserTypeContext.Provider>
  );
};

export const useUserType = (): UserTypeContextType => {
  const context = useContext(UserTypeContext);
  
  // Return a default context if not in a UserTypeProvider
  if (context === undefined) {
    return {
      userType: 'individual',
      setUserType: () => {},
      isInitialized: false
    };
  }
  
  return context;
};
