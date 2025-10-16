"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

export type UserType = 'individual' | 'business';

type UserTypeContextType = {
  userType: UserType;
  setUserType: (type: UserType) => void;
  
  isInitialized: boolean; 
};

const UserTypeContext = createContext<UserTypeContextType>({
  userType: 'individual',
  setUserType: () => {},
  isInitialized: false, 
});

export const UserTypeProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserType] = useState<UserType>('individual');

  return (
    <UserTypeContext.Provider 
      value={{ 
        userType, 
        setUserType, 
        isInitialized: true // Always true when used, ensuring no SSR block
      }}
    >
      {children}
    </UserTypeContext.Provider>
  );
};

export const useUserType = (): UserTypeContextType => {
  const context = useContext(UserTypeContext);
  
  if (!context) {
    console.error("useUserType must be used within a UserTypeProvider");
    return {
      userType: 'individual',
      setUserType: () => {},
      isInitialized: false,
    };
  }

  return context;
};