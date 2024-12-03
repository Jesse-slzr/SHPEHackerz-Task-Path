import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import {User, onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';
import { FIREBASE_AUTH } from '../FirebaseConfig';

export default function RootLayout() {
	const [initializing, setInitializing] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const router = useRouter();
	const segments = useSegments();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(FIREBASE_AUTH(), (currentUser: User | null) => {
			console.log('onAuthStateChanged', currentUser);
			setUser(currentUser);
			if (initializing) setInitializing(false);
		});

		return () => unsubscribe(); // Cleanup subscription
	}, [initializing]);

	useEffect(() => {
		if (initializing) return;

		const inAuthGroup = segments[0] === '(auth)';
        const isHomeScreen = segments[1] === 'SignOut';

		if (user && inAuthGroup && !isHomeScreen) {
            console.log('Redirecting to /dashboardScreens');
			router.replace('/screens/dashboardScreens');
		} else if (!user && !inAuthGroup) {
            console.log('Redirecting to /Login');
            router.replace('/(auth)/Login');
		}
	}, [user, initializing, segments, router]);

	if (initializing)
		return (
			<View
				style={{
					alignItems: 'center',
					justifyContent: 'center',
					flex: 1
				}}
			>
				<ActivityIndicator size="large" />
			</View>
		);

    return (
        <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
			<Stack.Screen name="screens/dashboardScreens" options={{ headerShown: false }} />
        </Stack>
        );
}