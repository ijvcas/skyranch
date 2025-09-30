import React, { createContext, useContext, useState } from 'react';

interface AIChatContextType {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const AIChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <AIChatContext.Provider value={{ chatOpen, setChatOpen }}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChatDialog = () => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChatDialog must be used within AIChatProvider');
  }
  return context;
};
