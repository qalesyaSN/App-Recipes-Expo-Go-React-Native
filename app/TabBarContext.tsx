import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

interface TabBarContextType {
  isTabBarVisible: boolean;
  setIsTabBarVisible: Dispatch<SetStateAction<boolean>>;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const TabBarProvider = ({ children }: { children: ReactNode }) => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  return (
    <TabBarContext.Provider value={{ isTabBarVisible, setIsTabBarVisible }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBarVisibility = () => {
  const context = useContext(TabBarContext);
  if (context === undefined) {
    throw new Error('useTabBarVisibility must be used within a TabBarProvider');
  }
  return context;
};
