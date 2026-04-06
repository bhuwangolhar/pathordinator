import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type RefreshContextType = {
  refreshCount: number;
  refreshUsers: () => void;
  triggerUsersRefresh: (reason: string) => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerUsersRefresh = (_reason: string) => {
    setRefreshCount(prev => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshCount, refreshUsers: triggerUsersRefresh, triggerUsersRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within RefreshProvider');
  }
  return context;
};
