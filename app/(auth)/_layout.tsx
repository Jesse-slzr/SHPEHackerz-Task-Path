import { Stack } from 'expo-router';

export default function AuthLayout() {
	return (
		<Stack>
			<Stack.Screen name="Login" options={{ headerShown: false }} />
            <Stack.Screen name="SignOut" options={{ headerShown: false }} />
            <Stack.Screen name="SignOutKids" options={{ headerShown: false }} />
        </Stack>
	);
}