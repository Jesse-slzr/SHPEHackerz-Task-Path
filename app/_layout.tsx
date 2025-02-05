import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import {User, onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';
import { FIREBASE_AUTH } from '../FirebaseConfig';
import { getUserType } from '../utils/firebaseUtils'; 

export default function RootLayout() {
	const [initializing, setInitializing] = useState(true);
	const [user, setUser] = useState<User | null>(null);
    const [userType, setUserType] = useState<string | null>(null);
	const router = useRouter();
	const segments = useSegments();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(FIREBASE_AUTH(), async (currentUser: User | null) => {
			setUser(currentUser);
            if (currentUser) {
                try {
                    const type = await getUserType(currentUser.uid);
                    setUserType(type);
                } catch (error) {
                    console.error("Error fetching user type:", error);
                }
            }
			setInitializing(false);
		});

		return () => unsubscribe(); // Cleanup subscription
	}, [initializing]);

	useEffect(() => {
		if (initializing || userType === null) return;

		const inAuthGroup = segments[0] === '(auth)';
        const inScreensGroup = segments[0] === 'screens';
        const inSignOut = segments[1] === 'SignOut' || segments[1] === 'SignOutKids';
        const isOnDashboard = segments[1] === 'dashboardScreens';
        const isOnKidsView = segments[1] === 'kidsViewScreens';

        if (!user && !inAuthGroup) {
            console.log('Redirecting to /Login');
            router.replace('/(auth)/Login');
        } else if (user && inAuthGroup && !inSignOut) {
            // Redirect based on user type
            if (userType === 'parent' && (!inScreensGroup && !isOnDashboard)) {
                console.log('Redirecting to /screens/dashboardScreens');
                router.replace('/screens/dashboardScreens');
            } else if (userType === 'kid' && (!inScreensGroup && !isOnKidsView)) {
                console.log('Redirecting to /screens/kidsViewScreens');
                router.replace('/screens/kidsViewScreens/');
            }
        }
	}, [user, userType, initializing, segments, router]);

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
			<Stack.Screen name="screens" options={{ headerShown: false }} />
        </Stack>
        );
}