import React, { useEffect } from 'react';
import './i18n';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, I18nManager, ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './screens/ThemeContext';
import { LanguageProvider, useLanguage } from './screens/LanguageContext';
import { AuthProvider, useAuth } from './screens/AuthContext';
import { NotificationProvider } from './screens/NotificationContext';
import { FavoritesProvider } from './screens/FavoritesContext';
import { FilterProvider } from './screens/FilterContext';
import { SearchHistoryProvider } from './screens/SearchHistoryContext';
import { RatingProvider } from './screens/RatingContext';
import { useForceUpdate } from './hooks/useForceUpdate';
import RTLUtils from './utils/RTLUtils';

// Screens
import HomeScreen from './screens/HomeScreen';
import MapboxMapScreen from './screens/MapboxMapScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Auth Stack Navigator
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <AuthStack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ animationEnabled: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          animationEnabled: true,
          cardStyle: { backgroundColor: '#fff' },
        }}
      />
    </AuthStack.Navigator>
  );
};

const AppNavigator = () => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated, loading } = useAuth();
  const forceUpdate = useForceUpdate();

  // Force re-render when RTL changes for instant navigation updates
  useEffect(() => {
    forceUpdate();

    // Update I18nManager for navigation headers
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      // Force restart to apply RTL changes to navigation
      I18nManager.swapLeftAndRightInRTL(isRTL);
    }
  }, [isRTL, forceUpdate, language]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  // Helper function to get proper header title style
  const getHeaderTitleStyle = () => {
    return {
      fontFamily: isRTL ? 'Arial' : 'System',
      fontSize: 18,
      fontWeight: '600',
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
    };
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack - Show Login/Register when not authenticated
          <Stack.Screen
            name="AuthStack"
            component={AuthStackNavigator}
            options={{ animationEnabled: false }}
          />
        ) : (
          // App Stack - Show main navigation when authenticated
          <Stack.Screen
            name="MainApp"
            component={MainAppNavigator}
            options={{ animationEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App Navigation (Bottom Tabs)
const MainAppNavigator = () => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Helper function to get proper header title style
  const getHeaderTitleStyle = () => {
    return {
      fontFamily: isRTL ? 'Arial' : 'System',
      fontSize: 18,
      fontWeight: '600',
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
    };
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#2196f3',
        },
        headerTintColor: '#fff',
        headerTitleAlign: isRTL ? 'right' : 'left',
        headerTitleStyle: getHeaderTitleStyle(),
        headerTitleContainerStyle: isRTL
          ? {
              right: 0,
              left: 300,
              alignItems: 'flex-end',
            }
          : {
              left: 16,
              right: 60,
              alignItems: 'flex-start',
            },
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: isDarkMode ? '#ccc' : '#666',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
          borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
          height: 90,
          paddingVertical: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          textAlign: isRTL ? 'right' : 'left',
          marginTop: 5,
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{
          title: t('navigation.home'),
          headerTitleAlign: isRTL ? 'right' : 'left',
          headerTitleStyle: getHeaderTitleStyle(),
          headerTitleContainerStyle: isRTL
            ? {
                right: 0,
                left: 235,
                alignItems: 'flex-end',
              }
            : {
                left: 16,
                right: 60,
                alignItems: 'flex-start',
              },
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'center',
                color: focused ? '#2196f3' : isDarkMode ? '#ccc' : '#666',
                lineHeight: 11,
                paddingHorizontal: 2,
                width: 80,
                flexWrap: 'wrap',
                numberOfLines: 3,
                textAlignVertical: 'center',
              }}
            >
              {t('navigation.home').split(' ').join('\n')}
            </Text>
          ),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚕️</Text>,
        }}
      />
      <Tab.Screen
        name="Carte"
        component={MapboxMapScreen}
        options={{
          title: t('navigation.map'),
          headerTitleAlign: isRTL ? 'right' : 'left',
          headerTitleStyle: getHeaderTitleStyle(),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'center',
                color: focused ? '#2196f3' : isDarkMode ? '#ccc' : '#666',
                lineHeight: 11,
                paddingHorizontal: 2,
                width: 80,
                flexWrap: 'wrap',
                numberOfLines: 3,
                textAlignVertical: 'center',
              }}
            >
              {t('navigation.map')}
            </Text>
          ),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="Calendrier"
        component={CalendarScreen}
        options={{
          title: t('navigation.calendar'),
          headerTitleAlign: isRTL ? 'right' : 'left',
          headerTitleStyle: getHeaderTitleStyle(),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'center',
                color: focused ? '#2196f3' : isDarkMode ? '#ccc' : '#666',
                lineHeight: 11,
                paddingHorizontal: 2,
                width: 80,
                flexWrap: 'wrap',
                numberOfLines: 3,
                textAlignVertical: 'center',
              }}
            >
              {t('navigation.calendar')}
            </Text>
          ),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Paramètres"
        component={SettingsScreen}
        options={{
          title: t('navigation.settings'),
          headerTitleAlign: isRTL ? 'right' : 'left',
          headerTitleStyle: getHeaderTitleStyle(),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'center',
                color: focused ? '#2196f3' : isDarkMode ? '#ccc' : '#666',
                lineHeight: 11,
                paddingHorizontal: 2,
                width: 80,
                flexWrap: 'wrap',
                numberOfLines: 3,
                textAlignVertical: 'center',
              }}
            >
              {t('navigation.settings')}
            </Text>
          ),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <FavoritesProvider>
              <FilterProvider>
                <SearchHistoryProvider>
                  <RatingProvider>
                    <NotificationProvider>
                      <AppNavigator />
                      <StatusBar />
                    </NotificationProvider>
                  </RatingProvider>
                </SearchHistoryProvider>
              </FilterProvider>
            </FavoritesProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
