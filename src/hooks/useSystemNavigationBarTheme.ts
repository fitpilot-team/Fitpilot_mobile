import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import type { AppTheme } from '../theme';

export const useSystemNavigationBarTheme = (
  theme: AppTheme,
  enabled: boolean = true,
) => {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') {
      return;
    }

    let cancelled = false;

    const syncNavigationBar = async () => {
      const operations = [
        NavigationBar.setBackgroundColorAsync(theme.colors.systemNavigationBarBackground),
        NavigationBar.setButtonStyleAsync(theme.colors.systemNavigationBarButtonStyle),
        NavigationBar.setBorderColorAsync(theme.colors.phoneNavShellBorder),
      ] as const;

      const results = await Promise.allSettled(operations);

      if (__DEV__ && !cancelled) {
        results.forEach((result) => {
          if (result.status === 'rejected') {
            console.warn('[Theme] android navigation bar sync skipped', result.reason);
          }
        });
      }
    };

    void syncNavigationBar();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    theme.colors.phoneNavShellBorder,
    theme.colors.systemNavigationBarBackground,
    theme.colors.systemNavigationBarButtonStyle,
  ]);
};
