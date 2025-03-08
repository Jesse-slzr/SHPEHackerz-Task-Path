import {
    View, 
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Switch
} from 'react-native';
import { useEffect, useState, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { useRouter } from 'expo-router';
import { darkContext } from '../darkContext';
import DarkProvider from '../darkContext';

const Page = () => {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const isDark = useContext(darkContext);
    const toggleDark = useContext(darkContext);

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
        <DarkProvider>
            <View style={isDark === "light" ? styles.lightBG : styles.darkBG}>
                <Image
                    source={require('@/assets/images/kel.png')}
                    style={styles.profileImage}
                />
                <Text style={[styles.mainText, isDark === "light" ? styles.lightMain : styles.darkMain]}>Logged in as {user?.email}</Text>
                <TouchableOpacity style={[styles.button, isDark === "light" ? styles.lightButton : styles.darkButton]}>
                    <Text style={isDark === "light" ? styles.lightBText : styles.darkBText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSignOut} style={[styles.button, isDark ==="light" ? styles.lightButton : styles.darkButton]}>
                    <Text style={isDark === "light" ? styles.lightBText : styles.darkBText}>Sign out</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/screens/dashboardScreens')} style={[styles.button, isDark ? styles.lightButton : styles.darkButton]}>
                    <Text style={isDark ? styles.lightBText : styles.darkBText}>Back to Dashboard</Text>
                </TouchableOpacity>
            <View style={styles.switchContainer}>
                <Text style={[styles.switchText, isDark ? styles.lightSwitch : styles.darkSwitch]}>Dark Mode</Text>
                    <Switch
                        value={isDark}
                        onValueChange={toggleDark}
                        thumbColor="#fff"
                    />
                <Text style={[styles.switchText, isDark ? styles.lightSwitch : styles.darkSwitch]}>Light Mode</Text>
            </View>
            </View>
        </DarkProvider>
	);
};

const styles = StyleSheet.create({
    mainText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 30 ,
    },
    lightMain: {
        color: '#000000'
    },
    darkMain: {
        color: '#FFFFFF'
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
    lightSwitch: {
        color: '#000000'
    },
    darkSwitch: {
        color: '#FFFFFF'
    },
    button: {
        flexDirection: 'row',
        marginVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        padding: 15,
        borderBottomWidth: 10,
        borderRightWidth: 5,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '50%',
        alignSelf: 'center'
    },
    lightButton: {
        backgroundColor: '#FFFFFF',
        borderColor: '#A8D5BA',
    },
    darkButton: {
        backgroundColor: '#222727',
        borderColor: '#6CAC86',
    },
    darkBText: {
        color: '#FFFFFF'
    },
    lightBText: {
        color: '#000000'
    },
    darkBG: {
        backgroundColor: '#151917',
        height: '100%'
    },
    lightBG: {
        backgroundColor: '#f0f0f0',
        height: '100%'
    }
});

export default Page;
