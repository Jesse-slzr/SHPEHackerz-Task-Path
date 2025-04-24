import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Pressable, 
    StyleSheet, 
    Modal, 
    Alert 
} from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB as FIRESTORE_DB } from '../../FirebaseConfig';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTrashAlt, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

interface Parent {
    docId: string;
    parentId: string;
    userUID: string;
    email: string;
    name: string;
    createdAt: Date;
    userType: string;
}

const ProfileScreen = () => {
    const [parentData, setParentData] = useState<Parent | null>(null);
    const [name, setName] = useState('');
    const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
    const [reauthModalVisible, setReauthModalVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordErrorVisible, setPasswordErrorVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); 
    const router = useRouter();
    const auth = FIREBASE_AUTH();
    const user = auth.currentUser;

    // Fetch parent data from Firestore
    useEffect(() => {
        if (!user) return;

        const parentQuery = query(
            collection(FIRESTORE_DB, 'Parents'),
            where('userUID', '==', user.uid)
        );

        const unsubscribe = onSnapshot(parentQuery, (snapshot) => {
            if (!snapshot.empty) {
                const parentDoc = snapshot.docs[0];
                const data = {
                    docId: parentDoc.id,
                    ...parentDoc.data(),
                    createdAt: parentDoc.data().createdAt.toDate(),
                } as Parent;
                setParentData(data);
                setName(data.name);
            }
        }, (error) => {
            // console.error('Error fetching parent data:', error);
            Alert.alert('Error', 'Failed to load profile data.');
        });

        return () => unsubscribe();
    }, [user]);

    // Handle updating parent information (name only)
    const handleUpdateProfile = async () => {
        if (!parentData || !user) return;

        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty.');
            return;
        }

        setLoading(true);
        try {
            if (name.trim() !== parentData.name) {
                const parentRef = doc(FIRESTORE_DB, 'Parents', parentData.docId);
                await updateDoc(parentRef, { name: name.trim() });
            }
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error: FirebaseError | any) {
            // console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Re-authenticate the user before deactivation
    const handleReauthenticate = async () => {
        if (!user || !password) return;

        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email!, password);
            await reauthenticateWithCredential(user, credential);
            setReauthModalVisible(false);
            setPassword('');
            await handleDeactivateAccount();
        } catch (error: FirebaseError | any) {
            // console.error('Error re-authenticating:', error);
            if (error.code === 'auth/wrong-password') {
                setErrorMessage('Incorrect password. Please try again.');
            } else {
                setErrorMessage('Re-authentication failed. Please try again later.');
            }
            setPasswordErrorVisible(true);
        } finally {
            setLoading(false);
        }
    };

    // Handle account deactivation
    const handleDeactivateAccount = async () => {
        if (!parentData || !user) return;

        setLoading(true);
        try {
            const parentRef = doc(FIRESTORE_DB, 'Parents', parentData.docId);
            await deleteUser(user);
            await deleteDoc(parentRef);
            Alert.alert('Success', 'Account deactivated successfully.');
            router.replace('/(auth)/Login');
        } catch (error: FirebaseError | any) {
            // console.error('Error deactivating account:', error);
            Alert.alert('Error', 'Failed to deactivate account: ' + error.message);
        } finally {
            setLoading(false);
            setDeactivateModalVisible(false);
        }
    };

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => router.back()}
                style={styles.headerButton}
                hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}
            >
                <FontAwesomeIcon icon={faArrowLeft} size={24} color="#A8D5BA" />
            </Pressable>
            <Text style={styles.title}>Profile Settings</Text>

            {parentData ? (
                <>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        editable={!loading}
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleUpdateProfile}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.deactivateButton, loading && styles.buttonDisabled]}
                        onPress={() => setReauthModalVisible(true)}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} size={24} color="#f44336" />
                        <Text style={styles.deactivateButtonText}>Deactivate Account</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <Text style={styles.loadingText}>Loading profile...</Text>
            )}

            {/* Deactivation confirmation modal */}
            <Modal
                visible={deactivateModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDeactivateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Confirm Account Deactivation</Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to deactivate your account? This action is permanent and will remove all your data, including your profile and associated kids' information.
                        </Text>
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setDeactivateModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleDeactivateAccount}
                            >
                                <Text style={styles.modalButtonText}>Deactivate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Re-authentication modal */}
            <Modal
                visible={reauthModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReauthModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                    {passwordErrorVisible ? (
                            // ADDED: Custom error popup within the modal
                            <View style={styles.errorPopup}>
                                <Text style={styles.errorPopupText}>{errorMessage}</Text>
                                <TouchableOpacity
                                    style={styles.errorPopupButton}
                                    onPress={() => setPasswordErrorVisible(false)}
                                >
                                    <Text style={styles.errorPopupButtonText}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Re-authenticate</Text>
                                <Text style={styles.modalText}>
                                    Please enter your password to confirm your identity before deactivating your account.
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    secureTextEntry
                                    editable={!loading}
                                />
                                <View style={styles.modalButtonRow}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => {
                                            setReauthModalVisible(false);
                                            setPassword('');
                                            setPasswordErrorVisible(false); // Reset error state on cancel
                                        }}
                                    >
                                        <Text style={styles.modalButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.confirmButton]}
                                        onPress={handleReauthenticate}
                                        disabled={loading || !password}
                                    >
                                        <Text style={styles.modalButtonText}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
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
        backgroundColor: '#FFF',
    },
    headerButton: {
        padding: 10,
        marginTop: 40,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#A8D5BA',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    button: {
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        borderWidth: 2,
        borderColor: '#A8D5BA',
        borderBottomWidth: 5,
        borderRightWidth: 3,
        width: '80%',
        alignSelf: 'center',
        elevation: 3,
        backgroundColor: '#A8D5BA',
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        borderColor: '#999',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#000',
    },
    deactivateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        borderWidth: 2,
        borderColor: '#f44336',
        borderBottomWidth: 5,
        borderRightWidth: 3,
        width: '80%',
        alignSelf: 'center',
        elevation: 3,
        backgroundColor: '#fff',
    },
    deactivateButtonText: {
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 15,
        color: '#f44336',
    },
    loadingText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
        backgroundColor: '#f44336',
    },
    cancelButton: {
        backgroundColor: '#4CAF50',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorPopup: {
        alignItems: 'center',
    },
    errorPopupText: {
        fontSize: 16,
        color: '#f44336',
        textAlign: 'center',
        marginBottom: 20,
    },
    errorPopupButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 8,
        backgroundColor: '#A8D5BA',
        alignItems: 'center',
        minWidth: 100,
    },
    errorPopupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;