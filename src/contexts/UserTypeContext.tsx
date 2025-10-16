"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

export type UserType = 'individual' | 'business';

type UserTypeContextType = {
  userType: UserType;
  setUserType: (type: UserType) => void;
  // isInitialized is now always true, ensuring full content rendering during SSR
  isInitialized: boolean; 
};

// Initialize context with a defined default value
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
        isInitialized: true 
      }}
    >
      {children}
    </UserTypeContext.Provider>
  );
};

export const useUserType = (): UserTypeContextType => {
  const context = useContext(UserTypeContext);
  
  if (!context) {
    // Return a safe default if used outside the Provider
    return {
      userType: 'individual',
      setUserType: () => {},
      isInitialized: false,
    };
  }

  return context;
};
