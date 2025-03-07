import {
    View, 
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Switch,
    Modal
} from 'react-native';
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { useRouter } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSignOutAlt, faArrowLeft } from '@fortawesome/free-solid-svg-icons';


const Page = () => {
    const [user, setUser] = useState<User | null>(null);
    const [signOutModalVisible, setSignOutModalVisible] = useState(false);
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
                <Text style={[styles.buttonText]}>Profile</Text>
            </TouchableOpacity>
			<TouchableOpacity onPress={() => setSignOutModalVisible(true)} style={[styles.buttonContainer]}>
                <FontAwesomeIcon icon={faSignOutAlt} size={24} color="#f44336"/>
                <Text style={styles.buttonText}>Sign out</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/screens/dashboardScreens')} style={styles.buttonContainer}>
                <FontAwesomeIcon icon={faArrowLeft} size={24} color="#A8D5BA" />
                <Text style={styles.buttonText}>Back to Dashboard</Text>
            </TouchableOpacity>
	        <View style={styles.switchContainer}>
                <Text style={[styles.switchText]}>Light Mode</Text>
                    <Switch
                        thumbColor="#fff"
                    />
                <Text style={[styles.switchText]}>Dark Mode</Text>
            </View>
            <Modal
                visible={signOutModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSignOutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Confirm Sign Out</Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to sign out? You will need to log in again to access Parent View or Kids View.
                        </Text>
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setSignOutModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleSignOut}
                            >
                                <Text style={styles.modalButtonText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        borderWidth: 2,
        borderColor: '#A8D5BA',
        borderBottomWidth: 10,
        borderRightWidth: 5,
        width: '80%',
        alignSelf: 'center',
        elevation: 3,
        backgroundColor: '#fff',
        
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 15,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Slightly lighter overlay
    },
    modalContent: {
        width: '85%',
        padding: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A8D5BA',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    modalText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 100,
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#f44336',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Page;
