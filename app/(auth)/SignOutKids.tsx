import {
    View, 
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal
} from 'react-native';
import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { useRouter } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircleUser, faSignOutAlt, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const KidsSettingsScreen = () => {
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

	return (
		<View style={[styles.container]}>
            <Text style={[styles.title]}>Settings</Text>
            <View style={styles.userInfo}>
                <FontAwesomeIcon icon={faCircleUser} size={50} color="#333" />
                <Text style={[styles.userText]}>
                    Parent Email: {user?.email || 'Loading...'}
                </Text>
            </View>

            {/* Sign Out */}
            <TouchableOpacity
                style={[styles.buttonContainer]}
                onPress={() => setSignOutModalVisible(true)}
            >
                <FontAwesomeIcon icon={faSignOutAlt} size={24} color="#f44336"/>
                <Text style={[styles.buttonText]}>Sign Out</Text>
            </TouchableOpacity>
            
            {/* Back to Selection Screen Button */}
            <TouchableOpacity
                style={styles.buttonContainer}
                onPress={() => router.push('/screens/kidsViewScreens')}
            >
                <FontAwesomeIcon icon={faArrowLeft} size={24} color="#A8D5BA" />
                <Text style={styles.buttonText}>Back to Selection Screen</Text>
            </TouchableOpacity>

            {/* Sign-Out Confirmation Modal */}
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
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    userText: {
        fontSize: 18,
        marginTop: 10,
        color: '#333',
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

export default KidsSettingsScreen;
