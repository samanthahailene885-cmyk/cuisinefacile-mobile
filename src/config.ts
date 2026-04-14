import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getHost = (): string => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : 'localhost';
  }

  const hostUri =
    // Expo Go / dev builds
    (Constants.expoConfig as any)?.hostUri ||
    // some older runtimes
    (Constants as any)?.manifest?.hostUri ||
    '';

  const host = String(hostUri).split(':')[0];
  return host || 'localhost';
};

export const SITE_BASE_URL = `http://${getHost()}/cuisinefacile`;
export const API_BASE_URL = `${SITE_BASE_URL}/php-api/api`;
