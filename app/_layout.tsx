import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import DashboardScreen from '../app/dashboardScreen/index';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tabs>
        <Tabs.Screen name="(tabs)" options={{ headerShown: false }} />
        <Tabs.Screen name="+not-found" />
        {/* Main Dashboard Tab */}
        {/* <Tabs.Screen
          name="dashboardScreen/index"
          options={{
            title: 'dashboardScreen',
            tabBarLabel: 'Dashboard',
            // You can set a custom icon here for the bottom tab
          }}
        /> */}
        
        {/* Task Screen Tab */}
        {/* <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarLabel: 'Tasks',
            // Custom icon can be set here as well for the tab
          }}
        /> */}
        
        {/* Other tabs like kids and rewards can be added here */}
      </Tabs>
    </ThemeProvider>
  );
}
