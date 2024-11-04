import { View, Text, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig'; // Make sure this imports your auth instance
import { useRouter } from 'expo-router';

const Page = () => {
	const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser: User | null) => {
			setUser(currentUser);
		});

		return () => unsubscribe();
	}, []);

    const handleSignOut = () => {
        FIREBASE_AUTH.signOut().then(() => {
            router.replace('/(auth)/Login');
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    };

	return (
		<View>
			<Text>Welcome back {user?.email}</Text>
			<Button title="Sign out" onPress={handleSignOut} />
		</View>
	);
};

export default Page;
