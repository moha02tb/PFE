import React, { useEffect } from 'react';
import './i18n';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, I18nManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from './screens/ThemeContext';
import { LanguageProvider, useLanguage } from './screens/LanguageContext';
import { useForceUpdate } from './hooks/useForceUpdate';
import { NotificationProvider } from './screens/NotificationContext';
import RTLUtils from './utils/RTLUtils';

// Screens
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
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
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#2196f3',
          },
          headerTintColor: '#fff',
          headerTitleAlign: isRTL ? 'right' : 'left',
          headerTitleStyle: getHeaderTitleStyle(),
          headerTitleContainerStyle: isRTL ? {
            right: 0,
            left: 300,
            alignItems: 'flex-end'
          } : {
            left: 16,  
            right: 60,
            alignItems: 'flex-start'
          },
          tabBarActiveTintColor: '#2196f3',
          tabBarInactiveTintColor: isDarkMode ? '#ccc' : '#666',
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
            borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
            height: 90, // Increased height to accommodate full text
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
    headerTitleContainerStyle: isRTL ? {
      right: 0,
      left: 235,
      alignItems: 'flex-end'
    } : {
      left: 16,  
      right: 60,
      alignItems: 'flex-start'
    },
    tabBarLabel: ({ focused }) => (
      <Text style={{ 
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        color: focused ? '#2196f3' : (isDarkMode ? '#ccc' : '#666'),
        lineHeight: 11,
        paddingHorizontal: 2,
        width: 80,
        flexWrap: 'wrap',
        numberOfLines: 3,
        textAlignVertical: 'center'
      }}>
        {t('navigation.home').split(' ').join('\n')}
      </Text>
    ),
    tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚕️</Text>
  }} 
/>
        <Tab.Screen 
          name="Carte" 
          component={MapScreen} 
          options={{ 
            title: t('navigation.map'),
            headerTitleAlign: isRTL ? 'right' : 'left',
            headerTitleStyle: getHeaderTitleStyle(),
            tabBarLabel: ({ focused }) => (
              <Text style={{ 
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'center',
                color: focused ? '#2196f3' : (isDarkMode ? '#ccc' : '#666'),
                lineHeight: 11,
                paddingHorizontal: 2,
                width: 80,
                flexWrap: 'wrap',
                numberOfLines: 3,
                textAlignVertical: 'center'
              }}>
                {t('navigation.map')}
              </Text>
            ),
            tabBarIcon: () => <Text style={{ fontSize: 18 }}>🗺️</Text>
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
              <Text style={{ 
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'center',
                color: focused ? '#2196f3' : (isDarkMode ? '#ccc' : '#666'),
                lineHeight: 11,
                paddingHorizontal: 2,
                width: 80,
                flexWrap: 'wrap',
                numberOfLines: 3,
                textAlignVertical: 'center'
              }}>
                {t('navigation.calendar')}
              </Text>
            ),
            tabBarIcon: () => <Text style={{ fontSize: 18 }}>📅</Text>
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
              <Text style={{ 
                fontSize: 9,
                fontWeight: 'bold',
                textAlign: 'center',
                color: focused ? '#2196f3' : (isDarkMode ? '#ccc' : '#666'),
                lineHeight: 11,
                paddingHorizontal: 2,
                width: 80,
                flexWrap: 'wrap',
                numberOfLines: 3,
                textAlignVertical: 'center'
              }}>
                {t('navigation.settings')}
              </Text>
            ),
            tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚙️</Text>
          }} 
        />
      </Tab.Navigator>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <AppNavigator />
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};