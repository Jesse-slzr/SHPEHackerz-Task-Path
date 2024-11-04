import { View, Text, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig'; // Make sure this imports your auth instance

const Page = () => {
	const [user, setUser] = useState<User | null>(null);

	// Subscribe to auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser: User | null) => {
			setUser(currentUser);
		});

		return () => unsubscribe(); // Cleanup subscription
	}, []);

	return (
		<View>
			<Text>Welcome back {user?.email}</Text>
			<Button title="Sign out" onPress={() => FIREBASE_AUTH.signOut()} />
		</View>
	);
};

export default Page;
