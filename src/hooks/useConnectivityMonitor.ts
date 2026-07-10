import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useConnectivityStore } from '../store/connectivityStore';

export const useConnectivityMonitor = () => {
  const setFromNetInfo = useConnectivityStore((state) => state.setFromNetInfo);

  useEffect(() => {
    let isMounted = true;

    NetInfo.fetch()
      .then((state) => {
        if (isMounted) {
          setFromNetInfo(state);
        }
      })
      .catch(() => undefined);

    const unsubscribe = NetInfo.addEventListener((state) => {
      setFromNetInfo(state);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setFromNetInfo]);
};
