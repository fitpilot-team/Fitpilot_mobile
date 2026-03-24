import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const TOP_VISIBILITY_THRESHOLD = 24;
const SCROLL_VISIBILITY_DELTA = 12;

type BottomTabBarVisibilityContextValue = {
  isVisible: boolean;
  hideTabBar: () => void;
  showTabBar: () => void;
};

const BottomTabBarVisibilityContext =
  createContext<BottomTabBarVisibilityContextValue | null>(null);

export function BottomTabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(true);

  const showTabBar = useCallback(() => {
    setIsVisible((currentValue) => (currentValue ? currentValue : true));
  }, []);

  const hideTabBar = useCallback(() => {
    setIsVisible((currentValue) => (currentValue ? false : currentValue));
  }, []);

  const value = useMemo(
    () => ({
      isVisible,
      hideTabBar,
      showTabBar,
    }),
    [hideTabBar, isVisible, showTabBar],
  );

  return (
    <BottomTabBarVisibilityContext.Provider value={value}>
      {children}
    </BottomTabBarVisibilityContext.Provider>
  );
}

export function useBottomTabBarVisibility() {
  const context = useContext(BottomTabBarVisibilityContext);

  if (!context) {
    throw new Error('useBottomTabBarVisibility must be used within BottomTabBarVisibilityProvider');
  }

  return context;
}

export function useBottomTabBarScroll() {
  const { hideTabBar, showTabBar } = useBottomTabBarVisibility();
  const lastOffsetYRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      lastOffsetYRef.current = 0;
      showTabBar();
    }, [showTabBar]),
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentOffsetY = event.nativeEvent.contentOffset.y;
      const scrollDelta = currentOffsetY - lastOffsetYRef.current;

      if (currentOffsetY <= TOP_VISIBILITY_THRESHOLD) {
        lastOffsetYRef.current = currentOffsetY;
        showTabBar();
        return;
      }

      if (Math.abs(scrollDelta) < SCROLL_VISIBILITY_DELTA) {
        return;
      }

      if (scrollDelta > 0) {
        hideTabBar();
      } else {
        showTabBar();
      }

      lastOffsetYRef.current = currentOffsetY;
    },
    [hideTabBar, showTabBar],
  );

  return {
    onScroll,
    scrollEventThrottle: 16 as const,
  };
}
