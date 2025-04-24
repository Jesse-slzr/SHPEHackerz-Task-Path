// KidScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet, Pressable, Modal, Alert, Keyboard, KeyboardAvoidingView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse, faPlus, faUndo } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../FirebaseConfig';
import { query, where, getDocs, collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';
import { getAuth } from 'firebase/auth';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

interface Kid {
    docId: string;
    kidId: string;
    name: string;
    age: number;
    coinCount: number;
    parentUuid: string;
}

const KidScreen = () => {
    const [kidName, setKidName] = useState('');
    const [kidAge, setKidAge] = useState('');
    const [kids, setKids] = useState<Kid[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createKidModalVisible, setCreateKidModalVisible] = useState(false);
    const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [deletedKid, setDeletedKid] = useState<Kid | null>(null);
    const [undoVisible, setUndoVisible] = useState(false);
    const undoTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchKids();
    }, []);

    const addKidToFirestore = async () => {
        console.log("Attempting to add kid...");
        if (kids.length >= 10) {
            console.log("Maximum number of kids reached.");
            Alert.alert("Sorry!", "The maximum number of children allowed is 10!");
            return;
        }

        const age = parseFloat(kidAge);
        if (age > 100) {
            console.log("Age exceeds limit.");
            Alert.alert("Invalid Age", "Number exceeds Age Limit!");
            return;
        }

        try {
            const auth = getAuth();
            const parentUuid = auth.currentUser?.uid || '';
            const kidId = uuid.v4();
            const newKid = {
                kidId: kidId as string,
                name: kidName,
                age: parseFloat(kidAge) || 0,
                coinCount: 0,
                parentUuid: parentUuid,
            };
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Kids'), newKid);
            setKids((prevKids) => [...prevKids, { ...newKid, docId: docRef.id }]);
            console.log("New kid added with ID: ", docRef.id);
            setKidName('');
            setKidAge('');
            setCreateKidModalVisible(false);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const fetchKids = async () => {
        try {
            const auth = getAuth();
            const parentUuid = auth.currentUser?.uid || '';
            const querySnapshot = await getDocs(query(collection(FIRESTORE_DB, 'Kids'), where('parentUuid', '==', parentUuid)));
            const fetchedKids: Kid[] = querySnapshot.docs.map((doc) => ({
                kidId: doc.data().kidId,
                ...doc.data(),
                docId: doc.id
            } as Kid));
            setKids(fetchedKids);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Kids:', error);
        }
    };

    const updateKid = async (kid: Kid, kidId: string, updatedName: string, updatedAge: string) => {
        try {
            const kidRef = doc(FIRESTORE_DB, 'Kids', kid.docId);
            await updateDoc(kidRef, { name: updatedName, age: parseFloat(updatedAge) || 0 });
            setKids((prevKids) => prevKids.map((kid) =>
                kid.kidId === kidId ? { ...kid, name: updatedName, age: parseFloat(updatedAge) || 0 } : kid
            ));
            setModalVisible(false);
            setSelectedKid(null);
            setKidName('');
            setKidAge('');
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    const deleteKid = async (kid: Kid) => {
        try {
            const kidRef = doc(FIRESTORE_DB, 'Kids', kid.docId);
            await deleteDoc(kidRef);
            setKids((prevKids) => prevKids.filter((prevKid) => prevKid.docId !== kid.docId));
            setSelectedKid(null);
            setModalVisible(false);
            setDeletedKid(kid);
            setUndoVisible(true);

            if (undoTimeout.current) {
                clearTimeout(undoTimeout.current);
            }

            undoTimeout.current = setTimeout(() => {
                setUndoVisible(false);
                setDeletedKid(null);
            }, 6000);

        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const undoDelete = async () => {
        if (deletedKid) {
            try {
                const docRef = await addDoc(collection(FIRESTORE_DB, 'Kids'), deletedKid);
                setKids((prevKids) => [...prevKids, { ...deletedKid, docId: docRef.id }]);
                setUndoVisible(false);
                setDeletedKid(null);
                if (undoTimeout.current) {
                    clearTimeout(undoTimeout.current);
                }
            } catch (error) {
                console.error("Error undoing delete: ", error);
            }
        }
    };

    const renderKid = ({ item }: { item: Kid }) => {
        const renderRightActions = () => (
            <Pressable style={styles.deleteButton} onPress={() => deleteKid(item)}>
                <FontAwesome name="trash" size={20} color="white" />
                <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
        );

        return (
            <Swipeable renderRightActions={renderRightActions}>
                <Pressable style={styles.kidItem} onPress={() => openKidModal(item)}>
                    <Text style={styles.kidName}>{item.name}</Text>
                </Pressable>
            </Swipeable>
        );
    };

    const openKidModal = (kid: Kid) => {
        setSelectedKid(kid);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedKid) {
            updateKid(selectedKid, selectedKid.kidId, selectedKid.name, selectedKid.age.toString());
        }
    };

    const handleDelete = () => {
        if (selectedKid) {
            deleteKid(selectedKid);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A8D5BA" />
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <KeyboardAvoidingView behavior="padding" style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.push('../dashboardScreens')} style={styles.headerButton} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                        <FontAwesomeIcon icon={faHouse} size={24} color="black" />
                    </Pressable>
                </View>

                <Text style={styles.title}>Manage Kids</Text>
                <FlatList
                    data={kids}
                    keyExtractor={(item) => item.kidId || item.docId}
                    renderItem={renderKid}
                />

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}>
                    {modalVisible}
                    <View style={styles.overlay}>
                        <View style={styles.modalView}>
                            <Pressable onPress={() => setModalVisible(false)} style={styles.closeXButton}>
                                <FontAwesome name="close" size={24} color="black" />
                            </Pressable>

                            <Text style={styles.modalTitle}>Edit Kid</Text>

                            <Text style={styles.modalSubTitle}>Name:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Edit Kid name"
                                placeholderTextColor="#333"
                                value={selectedKid ? selectedKid.name : ''}
                                onChangeText={(text) => setSelectedKid((prev) => ({ ...prev, name: text }) as Kid | null)}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />

                            <Text style={styles.modalSubTitle}>Age:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter kid's age"
                                placeholderTextColor="#333"
                                keyboardType="numeric"
                                value={selectedKid ? String(selectedKid.age) : ''}
                                onChangeText={(text) => setSelectedKid((prev) => ({ ...prev, age: parseInt(text.replace(/[^0-9]/g, ''), 10) }) as Kid | null)}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />

                            <Pressable style={[styles.button, styles.buttonSave]} onPress={handleSave}>
                                <Text style={styles.textStyle}>Save</Text>
                            </Pressable>
                            <Pressable style={[styles.button, styles.buttonDelete]} onPress={handleDelete}>
                                <Text style={styles.textStyle}>Delete</Text>
                            </Pressable>
                            <Pressable style={[styles.button, styles.buttonClose]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.textStyle}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                <Pressable style={styles.plusButtonStyle} onPress={() => setCreateKidModalVisible(true)}>
                    <FontAwesome name="plus" size={12} color="black" />
                </Pressable>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={createKidModalVisible}
                    onRequestClose={() => setCreateKidModalVisible(false)}
                >
                    <View style={styles.overlay}>
                        <View style={styles.modalView}>
                            <Pressable onPress={() => setCreateKidModalVisible(false)} style={styles.closeXButton}>
                                <FontAwesome name="close" size={24} color="black" />
                            </Pressable>

                            <Text style={styles.modalTitle}>Create Kid</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Kid Name"
                                placeholderTextColor="#333"
                                value={kidName}
                                onChangeText={setKidName}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Age"
                                placeholderTextColor="#333"
                                keyboardType="numeric"
                                value={kidAge}
                                onChangeText={setKidAge}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                            <Pressable style={styles.plusButtonStyle} onPress={addKidToFirestore}>
                                <FontAwesome name="plus" size={12} color="black" />
                            </Pressable>
                            <Pressable style={styles.buttonClose} onPress={() => setCreateKidModalVisible(false)}>
                                <Text>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                {undoVisible && deletedKid && (
                    <Pressable style={styles.undoButton} onPress={undoDelete}>
                        <FontAwesomeIcon icon={faUndo} size={24} color="white" />
                        <Text style={styles.undoText}>Undo Delete</Text>
                    </Pressable>
                )}

                <View style={styles.bottomNavigation}>
                    <Pressable onPress={() => router.push('/screens/dashboardScreens/TasksManagementScreen')} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                        <FontAwesomeIcon icon={faTasks} size={24} color="black" />
                    </Pressable>
                    <Pressable onPress={() => router.push('/screens/dashboardScreens/KidsManagementScreen')} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                        <FontAwesomeIcon icon={faChild} size={24} color="black" />
                    </Pressable>
                    <Pressable onPress={() => router.push('/screens/dashboardScreens/RewardsManagementScreen')} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                        <FontAwesomeIcon icon={faGift} size={24} color="black" />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        padding: 16,
        paddingTop: 48,
        backgroundColor: '#A8D5BA',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerButton: {
        padding: 10
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
        alignSelf: 'center',
        paddingTop: 10
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kidItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 10,
        marginVertical: 5,
        width: '90%',
        alignSelf: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: '#A8D5BA',
        borderWidth: 1,
        padding: 15,
        borderBottomWidth: 10,
        borderBottomColor: '#A8D5BA',
        borderRightWidth: 5,
        borderRightColor: '#A8D5BA',
    },
    kidName: {
        fontSize: 16,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    closeXButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalSubTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
    },
    button: {
        width: '50%',
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonSave: {
        backgroundColor: '#51abf6'
    },
    buttonDelete: {
        backgroundColor: '#FF5f57'
    },
    buttonClose: {
        backgroundColor: '#A8D5BA',
        padding: 10,
        borderRadius: 10
    },
    textStyle: {
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    plusButtonStyle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#A8D5BA',
        borderColor: '#fff',
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        backgroundColor: '#A8D5BA',
        padding: 16,
        paddingBottom: 48,
    },

    deleteButton: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    undoButton: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    undoText: {
        color: 'white',
        marginLeft: 5,
    },
});

export default KidScreen;
