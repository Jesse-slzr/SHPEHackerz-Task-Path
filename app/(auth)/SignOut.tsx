import {
    View, 
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Switch
} from 'react-native';
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { useRouter } from 'expo-router';

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

	return (
		<View>
            <Image
                source={require('@/assets/images/blank-pfp.png')}
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
            <View style={styles.switchContainer}>
                <Text style={[styles.switchText]}>Light Mode</Text>
                    <Switch
                        thumbColor="#fff"
                    />
                <Text style={[styles.switchText]}>Dark Mode</Text>
            </View>
		</View>
	);
};

const styles = StyleSheet.create({
    mainText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 30
    },
    profileImage: {
        height: 130,
        width: 130,
        borderRadius: 65,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 70
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    switchText: {
        fontSize: 16,
        marginHorizontal: 10,
    },
    highlightText: {
        fontWeight: 'bold',
        color: '#000', // Highlight color (red for Kids, green for Parent)
    },
    buttonContainer: {
        flexDirection: 'row',
        marginVertical: 10,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        padding: 15,
        borderColor: '#A8D5BA',
        borderBottomWidth: 10,
        borderRightWidth: 5,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '70%',
        alignSelf: 'center'
    }
});

export default Page;
