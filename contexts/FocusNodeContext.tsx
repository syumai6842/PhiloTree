import React, { createContext, useContext, useRef, useState } from 'react';

interface FocusNodeContextType {
  focusNode: (nodeId: string) => void;
  subscribe: (callback: (nodeId: string) => void) => () => void;
  pendingNodeId: string | null;
  clearPending: () => void;
}

const FocusNodeContext = createContext<FocusNodeContextType | undefined>(undefined);

export const FocusNodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listeners = useRef<((nodeId: string) => void)[]>([]);
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null);

  const focusNode = (nodeId: string) => {
    listeners.current.forEach(cb => cb(nodeId));
    setPendingNodeId(nodeId);
  };

  const subscribe = (callback: (nodeId: string) => void) => {
    listeners.current.push(callback);
    return () => {
      listeners.current = listeners.current.filter(cb => cb !== callback);
    };
  };

  const clearPending = () => setPendingNodeId(null);

  return (
    <FocusNodeContext.Provider value={{ focusNode, subscribe, pendingNodeId, clearPending }}>
      {children}
    </FocusNodeContext.Provider>
  );
};

export const useFocusNode = () => {
  const ctx = useContext(FocusNodeContext);
  if (!ctx) throw new Error('useFocusNode must be used within FocusNodeProvider');
  return ctx;
}; 