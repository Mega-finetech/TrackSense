import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { fidelityPalettes, palettes, ThemeMode } from './tokens';
import { storage } from '../services/storage';
import { usePreferencesStore } from '../stores/preferencesStore';

const ThemeContext = createContext({ colors: palettes.light, dark: false, mode: 'system' as ThemeMode,
  setMode: async (_mode: ThemeMode) => {} });

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [deviceMode, updateMode] = useState<ThemeMode>('system');
  const preferences = usePreferencesStore();
  const mode = preferences.userId ? preferences.theme : deviceMode;
  useEffect(() => { storage.get('tracksense_theme').then(value => {
    if (value === 'light' || value === 'dark' || value === 'system') updateMode(value);
  }).catch(() => {}); }, []);
  const setMode = async (value: ThemeMode) => {
    if (preferences.userId) { await preferences.saveTheme(value); return; }
    await storage.set('tracksense_theme', value);
    updateMode(value);
  };
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return <ThemeContext.Provider value={{ colors: palettes[dark ? 'dark' : 'light'], dark, mode, setMode }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);

export function FidelityTheme({ children }: PropsWithChildren) {
  const theme = useTheme();
  return <ThemeContext.Provider value={{ ...theme, colors: fidelityPalettes[theme.dark ? 'dark' : 'light'] }}>{children}</ThemeContext.Provider>;
}
