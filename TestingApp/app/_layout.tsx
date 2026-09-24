import { DefaultEducationalMaterialProvider } from '@/contexts/default-educational-material';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Component, type ReactNode, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';
import { Provider } from 'react-redux';

import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { store } from '@/store/store';

export const unstable_settings = {
  initialRouteName: 'index',
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) {
      console.error('App ErrorBoundary caught:', error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>حدث خطأ</Text>
          <Text style={errorStyles.message}>
            حدثت مشكلة. يمكنك إعادة المحاولة أو العودة لتسجيل الدخول.
          </Text>
          <TouchableOpacity
            style={errorStyles.retryButton}
            onPress={this.handleRetry}
            activeOpacity={0.8}
          >
            <Text style={errorStyles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8, color: Colors.light.text },
  message: { fontSize: 16, color: Colors.light.icon, textAlign: 'center', marginBottom: 24 },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: { color: SemanticColors.onTint, fontSize: 16, fontWeight: '600' },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Prevent screenshots (optional, delayed to avoid affecting startup)
    const t = setTimeout(async () => {
      try {
        const ScreenCapture = await import('expo-screen-capture');
        await ScreenCapture.preventScreenCaptureAsync();
      } catch {
        // Ignore: not critical, some devices may not support
      }
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AppErrorBoundary>
    <Provider store={store}>
      <DefaultEducationalMaterialProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="parent-home" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="solve-exam" options={{ headerShown: false }} />
          <Stack.Screen name="build-exam" options={{ headerShown: false }} />
          <Stack.Screen name="category-exams" options={{ headerShown: false }} />
          <Stack.Screen name="material-exams" options={{ headerShown: false }} />
          <Stack.Screen name="challenge-game" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      </DefaultEducationalMaterialProvider>
    </Provider>
    </AppErrorBoundary>
  );
}
