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
    const [isDark, setIsDark] = useState(true);
    const router = useRouter();
    const mainTextStyle = isDark === false ? styles.lightMain : styles.darkMain;
    const switchTextStyle = isDark === false ? styles.lightSwitch : styles.darkSwitch;
    const buttonStyle = isDark === false ? styles.lightButton : styles.darkButton;
    const buttonTextStyle = isDark === false ? styles.lightBText : styles.darkBText;
    const bgStyle = isDark === false ? styles.lightBG : styles.darkBG;

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
            <View style={bgStyle}>
                <Image
                    source={require('@/assets/images/kel.png')}
                    style={styles.profileImage}
                />
                <Text style={[styles.mainText, mainTextStyle]}>Logged in as {user?.email}</Text>
                <TouchableOpacity style={[styles.button, buttonStyle]}>
                    <Text style={buttonTextStyle}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSignOut} style={[styles.button, buttonStyle]}>
                    <Text style={buttonTextStyle}>Sign out</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/screens/dashboardScreens')} style={[styles.button, buttonStyle]}>
                    <Text style={buttonTextStyle}>Back to Dashboard</Text>
                </TouchableOpacity>
            <View style={styles.switchContainer}>
                <Text style={[styles.switchText, switchTextStyle]}>Light Mode</Text>
                    <Switch
                        value={isDark}
                        onValueChange={setIsDark}
                        thumbColor="#fff"
                    />
                <Text style={[styles.switchText, switchTextStyle]}>Dark Mode</Text>
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
    highlightText: {
        fontWeight: 'bold',
        color: '#000', // Highlight color (red for Kids, green for Parent)
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
