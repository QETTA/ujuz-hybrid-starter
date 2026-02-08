import { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Sentry (graceful if not configured)
    try {
      // Dynamic import to avoid build errors when Sentry is not installed
      import('@/app/services/monitoring/sentry')
        .then((sentry) => {
          sentry.reportErrorBoundary(error, errorInfo.componentStack || '');
        })
        .catch(() => {
          // Sentry not available - error already logged to console
        });
    } catch {
      // Module resolution failed - error already logged to console
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle" size={64} color={Colors.error} />
            <TamaguiText preset="h3" textColor="primary" weight="bold" style={styles.title}>
              {COPY.ERROR_TITLE}
            </TamaguiText>
            <TamaguiText preset="body" textColor="secondary" style={styles.message}>
              {this.state.error?.message || COPY.ERROR_UNEXPECTED}
            </TamaguiText>
            <TamaguiPressableScale
              style={styles.button}
              onPress={this.resetError}
              hapticType="light"
              accessibilityLabel={COPY.A11Y_RETRY}
              accessibilityHint={COPY.A11Y_RETRY_HINT}
            >
              <Ionicons name="refresh" size={20} color={Colors.textLight} />
              <TamaguiText
                preset="body"
                textColor="inverse"
                weight="semibold"
                style={styles.buttonText}
              >
                {COPY.RETRY}
              </TamaguiText>
            </TamaguiPressableScale>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    gap: Layout.spacing.sm,
  },
  buttonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: Layout.fontWeight.semibold,
    color: Colors.textLight,
  },
});
