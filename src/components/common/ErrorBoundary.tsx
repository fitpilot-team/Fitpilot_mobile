import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize } from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const ErrorFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={56} color={theme.colors.textMuted} />
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.description}>
        Ocurrió un error inesperado. Intenta de nuevo; si el problema continúa, cierra y vuelve a
        abrir la app.
      </Text>
      <Button title="Reintentar" onPress={onRetry} />
    </View>
  );
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    description: {
      fontSize: fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
  });
