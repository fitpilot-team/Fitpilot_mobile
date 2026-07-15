import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { hasHandledConnectedHealthSetupForInstallation } from '../src/services/connectedHealthInstallation';
import { useAuthStore } from '../src/store/authStore';

type InstallationSetupCheck = {
  userId: string;
  handled: boolean;
};

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  const [installationSetupCheck, setInstallationSetupCheck] =
    useState<InstallationSetupCheck | null>(null);

  const shouldCheckInstallation =
    isAuthenticated &&
    user?.onboardingStatus === 'completed' &&
    user.connectedHealthSetupStatus === 'completed';

  useEffect(() => {
    if (!shouldCheckInstallation || !user?.id) {
      setInstallationSetupCheck(null);
      return;
    }

    let cancelled = false;
    const userId = user.id;

    setInstallationSetupCheck(null);
    void hasHandledConnectedHealthSetupForInstallation(userId)
      .then((handled) => {
        if (!cancelled) {
          setInstallationSetupCheck({ userId, handled });
        }
      })
      .catch(() => {
        if (!cancelled) {
          // A storage failure must not leave an authenticated user on a blank route.
          setInstallationSetupCheck({ userId, handled: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shouldCheckInstallation, user?.id]);

  // Redirect based on auth state
  if (isAuthenticated) {
    if (user?.onboardingStatus !== 'completed') {
      return <Redirect href="/onboarding" />;
    }

    const setup = user?.connectedHealthSetupStatus;
    if (setup === 'completed') {
      if (installationSetupCheck?.userId !== user.id) {
        return null;
      }

      if (!installationSetupCheck.handled) {
        return <Redirect href="/health-setup" />;
      }
    } else if (setup !== 'skipped') {
      return <Redirect href="/health-setup" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
