import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';

type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isDark,
      spacing,
      radius,
      typography,
    }),
    [theme, themeMode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export * from './colors';
export * from './spacing';
export * from './typography';
