import { Platform } from 'react-native';
import { resolveApiUrl } from '../services/apiUrl';
export const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, __DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api') : '');
if (__DEV__) console.info('[TrackSense auth] API_CONFIGURATION', { source: process.env.EXPO_PUBLIC_API_URL ? 'EXPO_PUBLIC_API_URL' : 'development fallback', baseURL: API_URL || 'invalid or missing' });
export const APP_NAME = 'TrackSense';
export const APP_VERSION = '1.0.0';

export const COLORS = {
  navy: '#0A1628',
  navyMid: '#0D2137',
  navyLight: '#1B3A5C',
  cyan: '#00B4D8',
  cyanLight: '#90E0EF',
  cyanPale: '#E0F7FC',
  surface: '#FAFAFA',
  border: '#E8F4F8',
  textPrimary: '#0A1628',
  textSecondary: '#4A6080',
  textMuted: '#8BA3B8',
  white: '#FFFFFF',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  purple: '#8B5CF6',
  pink: '#F43F5E',
} as const;
