import { Stack } from 'expo-router';

export default function ScreensLayout() {
    return (
        <Stack>
            <Stack.Screen name="dashboardScreens" options={{ headerShown: false }} />
            <Stack.Screen name="kidsViewScreens" options={{ headerShown: false }} />
        </Stack>
    );
}