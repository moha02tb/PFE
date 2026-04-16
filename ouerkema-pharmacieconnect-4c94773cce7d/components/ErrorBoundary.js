import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './design-system';

/**
 * Error Boundary - catches JavaScript errors anywhere in the app
 * Prevents white screen crashes
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // You could log the error to a service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <AppText variant="headerMedium" style={styles.title}>
            Oops! Something went wrong
          </AppText>
          <AppText variant="bodySmall" style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </AppText>
          <AppText variant="captionSmall" style={styles.hint}>
            Please try again or restart the app
          </AppText>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 12,
  },
  message: {
    marginBottom: 8,
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    color: '#999',
  },
});

export default ErrorBoundary;
