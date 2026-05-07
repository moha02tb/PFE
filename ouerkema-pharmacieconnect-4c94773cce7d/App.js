import React, { useEffect } from 'react';
import './i18n';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  I18nManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './screens/ThemeContext';
import { LanguageProvider, useLanguage } from './screens/LanguageContext';
import { AuthProvider, useAuth } from './screens/AuthContext';
import { NotificationProvider } from './screens/NotificationContext';
import { FavoritesProvider } from './screens/FavoritesContext';
import { FilterProvider } from './screens/FilterContext';
import { SearchHistoryProvider } from './screens/SearchHistoryContext';
import { RatingProvider } from './screens/RatingContext';
import ErrorBoundary from './components/ErrorBoundary';
import { getTheme } from './utils/theme';
import HomeScreen from './screens/HomeScreen';
import MapboxMapScreen from './screens/MapboxMapScreen';
import CalendarScreen from './screens/CalendarScreen';
import MedicinesScreen from './screens/MedicinesScreen';
import MedicineDetailScreen from './screens/MedicineDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const TAB_ICONS = {
  Accueil: { active: 'home', inactive: 'home-outline', library: Ionicons },
  Carte: { active: 'map', inactive: 'map-outline', library: Ionicons },
  Calendrier: { active: 'calendar', inactive: 'calendar-outline', library: Ionicons },
  Medicaments: { active: 'medkit', inactive: 'medkit-outline', library: Ionicons },
  Parametres: { active: 'cog', inactive: 'cog-outline', library: MaterialCommunityIcons },
};

function AuthStackNavigator() {
  const { pendingVerificationEmail } = useAuth();
  const theme = getTheme(false);

  return (
    <AuthStack.Navigator
      key={pendingVerificationEmail ? `verify-${pendingVerificationEmail}` : 'auth-default'}
      initialRouteName={pendingVerificationEmail ? 'VerifyEmail' : 'LoginScreen'}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        initialParams={pendingVerificationEmail ? { email: pendingVerificationEmail } : undefined}
      />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { isAuthenticated, loading } = useAuth();
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      I18nManager.swapLeftAndRightInRTL(isRTL);
    }
  }, [isRTL]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.loadingShell,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            {t('common.loading', 'Loading your workspace')}
          </Text>
        </View>
      </View>
    );
  }

  const navigationTheme = isDarkMode
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          border: theme.colors.border,
          text: theme.colors.text,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          border: theme.colors.border,
          text: theme.colors.text,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="AuthStack"
            component={AuthStackNavigator}
            options={{ animation: 'none' }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainApp"
              component={MainAppNavigator}
              options={{ animation: 'none' }}
            />
            <Stack.Screen
              name="Chatbot"
              component={ChatbotScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: t('navigation.chatbot', 'First aid'),
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerShadowVisible: false,
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  color: theme.colors.text,
                },
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            />
            <Stack.Screen
              name="MedicineDetail"
              component={MedicineDetailScreen}
              options={{
                presentation: 'card',
                headerShown: true,
                title: t('medicines.detailTitle', 'Medicine details'),
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerShadowVisible: false,
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                  fontSize: 18,
                  fontWeight: '700',
                  color: theme.colors.text,
                },
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainAppNavigator({ navigation }) {
  const { isDarkMode } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = getTheme(isDarkMode);

  const renderTabIcon = (routeName, focused) => {
    const config = TAB_ICONS[routeName];
    const IconComponent = config.library;
    return (
      <View
        style={[
          styles.tabIconShell,
          {
            backgroundColor: focused ? theme.colors.primary : 'transparent',
            borderColor: focused ? theme.colors.primary : theme.colors.border,
          },
          focused ? styles.tabIconShellActive : null,
        ]}
      >
        <IconComponent
          name={focused ? config.active : config.inactive}
          size={focused ? 21 : 20}
          color={focused ? theme.colors.textInverse : theme.colors.iconMuted}
        />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 26,
            fontWeight: '700',
            color: theme.colors.text,
          },
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          sceneStyle: { backgroundColor: theme.colors.background },
          tabBarShowLabel: true,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 3,
          },
          tabBarIcon: ({ focused }) => renderTabIcon(route.name, focused),
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 12 + insets.bottom,
            height: 74,
            borderRadius: 24,
            borderTopWidth: 1,
            borderWidth: 1,
            borderColor: theme.colors.tabBarBorder,
            backgroundColor: theme.colors.tabBar,
            paddingTop: 10,
            paddingBottom: 8,
            paddingHorizontal: 8,
            shadowColor: theme.colors.shadow,
            shadowOpacity: isDarkMode ? 0.28 : 0.1,
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 22,
            elevation: 14,
          },
          tabBarItemStyle: { borderRadius: 16, paddingVertical: 2 },
        })}
      >
        <Tab.Screen
          name="Accueil"
          component={HomeScreen}
          options={{ title: t('navigation.home'), tabBarLabel: t('navigation.home') }}
        />
        <Tab.Screen
          name="Carte"
          component={MapboxMapScreen}
          options={{ title: t('navigation.map'), tabBarLabel: t('navigation.map') }}
        />
        <Tab.Screen
          name="Calendrier"
          component={CalendarScreen}
          options={{ title: t('navigation.calendar'), tabBarLabel: t('navigation.calendar') }}
        />
        <Tab.Screen
          name="Medicaments"
          component={MedicinesScreen}
          options={{
            title: t('navigation.medicines', 'Medicines'),
            tabBarLabel: t('navigation.medicines', 'Medicines'),
          }}
        />
        <Tab.Screen
          name="Parametres"
          component={SettingsScreen}
          options={{ title: t('navigation.settings'), tabBarLabel: t('navigation.settings') }}
        />
      </Tab.Navigator>

      <TouchableOpacity
        style={[
          styles.chatBubble,
          {
            right: isRTL ? undefined : 22,
            left: isRTL ? 22 : undefined,
            bottom: 104 + insets.bottom,
          },
        ]}
        onPress={() => navigation.navigate('Chatbot')}
        accessibilityRole="button"
        accessibilityLabel={t('chatbot.bubbleLabel', 'Open first aid assistant')}
      >
        <View style={[styles.chatOuter, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.chatInner}>
            <Feather name="message-circle" size={22} color={theme.colors.textInverse} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <FavoritesProvider>
                  <FilterProvider>
                    <SearchHistoryProvider>
                      <RatingProvider>
                        <NotificationProvider>
                          <AppNavigator />
                          <StatusBar style="auto" />
                        </NotificationProvider>
                      </RatingProvider>
                    </SearchHistoryProvider>
                  </FilterProvider>
                </FavoritesProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingShell: {
    minWidth: 220,
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabIconShell: {
    width: 44,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tabIconShellActive: {
    shadowColor: '#10233A',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  chatBubble: {
    position: 'absolute',
  },
  chatOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(247,251,255,0.24)',
    shadowColor: '#10233A',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 14,
  },
  chatInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(247,251,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
