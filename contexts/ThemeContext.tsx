import React, { createContext, ReactNode, useContext, useState } from 'react';
import { getCurrentTheme, getPhiloTreeColors, setTheme as setThemeColors, ThemeType } from '../constants/Colors';

interface ThemeContextType {
  currentTheme: ThemeType;
  colors: ReturnType<typeof getPhiloTreeColors>;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(getCurrentTheme());

  const toggleTheme = () => {
    const newTheme: ThemeType = currentTheme === 'light' ? 'dark' : 'light';
    setThemeColors(newTheme);
    setCurrentTheme(newTheme);
  };

  const setTheme = (theme: ThemeType) => {
    setThemeColors(theme);
    setCurrentTheme(theme);
  };

  const colors = getPhiloTreeColors();

  return (
    <ThemeContext.Provider value={{ currentTheme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 