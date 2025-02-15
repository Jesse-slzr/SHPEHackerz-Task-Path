import {
    View, 
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { useRouter } from 'expo-router';
import { ColorProperties } from 'react-native-reanimated/lib/typescript/reanimated2/Colors';

const Page = () => {
	const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    // Check if the user is logged in
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(FIREBASE_AUTH(), (currentUser: User | null) => {
			setUser(currentUser);
		});

		return () => unsubscribe();
	}, []);

    // Handle sign out
    const handleSignOut = () => {
        FIREBASE_AUTH().signOut().then(() => {
            router.replace('/(auth)/Login');
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    };

    // settings page for user - buttons for the following: profile, sign out 
    // back to dashboard, and a toggle for light/dark mode (to be replaced with menu later)
	return (
		<View>
            <Image
                source={require('@/assets/images/kel.png')}
                style={styles.profileImage}
            />
            <Text style={[styles.mainText]}>Logged in as {user?.email}</Text>
            <TouchableOpacity style={[styles.buttonContainer]}>
                <Text>Profile</Text>
            </TouchableOpacity>
			<TouchableOpacity onPress={handleSignOut} style={[styles.buttonContainer]}>
                <Text>Sign out</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/screens/dashboardScreens')} style={styles.buttonContainer}>
                <Text>Back to Dashboard</Text>
            </TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
    mainText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 70
    },
    buttonContainer: {
        marginVertical: 10,
        borderRadius: 10,
        backgroundColor: '#A8D5BA',
        borderColor: '#fff',
        borderWidth: 3,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '70%',
        alignSelf: 'center'
    }
});

export default Page;
