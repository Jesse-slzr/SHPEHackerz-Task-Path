// KidScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet, Pressable, Modal, KeyboardAvoidingView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { query, where, getDocs, collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';
import { getAuth } from 'firebase/auth';

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
    const [kidCoinCount, setKidCoinCount] = useState('');
    const [kids, setKids] = useState<Kid[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createKidModalVisible, setCreateKidModalVisible] = useState(false);
    const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchKids();
    }, []);

    const addKidToFirestore = async () => {
        try {
            const auth = getAuth();
            const parentUuid = auth.currentUser?.uid || '';
            const kidId = uuid.v4() // Generate unique ID
            const newKid = {
                kidId: kidId,
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
            setKidCoinCount('');
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
            console.log("kidRef", kidRef);
            await deleteDoc(kidRef);
            setKids((prevKids) => prevKids.filter((prevKid) => prevKid.docId !== kid.docId));
            setSelectedKid(null);
            setModalVisible(false);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const renderKid = ({ item }: { item: Kid}) => (
        <Pressable style={styles.kidItem} onPress={() => openKidModal(item)}>
            <Text>{item.name}</Text>
        </Pressable>
    );

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
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading Tasks...</Text>
        </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
            {/* Header with settings and navigation to kids view */}
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
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={{ marginBottom: 5, textAlign: 'center' }}>Kid Name:</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Edit Kid name" 
                            placeholderTextColor="#333" 
                            value={selectedKid ? selectedKid.name : ''} 
                            onChangeText={(text) => setSelectedKid((prev) => ({ ...prev, name: text }) as Kid | null)} 
                        />

                        <Text>Kid Age:</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter kid's age" // Add placeholder
                            placeholderTextColor="#333" 
                            keyboardType="numeric" 
                            value={selectedKid ? String(selectedKid.age) : ''} 
                            onChangeText={(text) => setSelectedKid((prev) => ({ ...prev, age: parseInt(text.replace(/[^0-9]/g, ''), 10) }) as Kid | null)} 
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

            {/* Create Kid Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createKidModalVisible}
                onRequestClose={() => setCreateKidModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={{ marginVertical: 5, textAlign: 'center', fontWeight: 'bold' }}>Create Kid</Text>
                        <TextInput style={styles.input} placeholder="Kid Name" placeholderTextColor="#333" value={kidName} onChangeText={setKidName} />
                        <TextInput style={styles.input} placeholder="Age" placeholderTextColor="#333" keyboardType="numeric" value={kidAge} onChangeText={setKidAge} />
                        <Pressable style={styles.plusButtonStyle} onPress={addKidToFirestore}>
                            <FontAwesome name="plus" size={12} color="black" />
                        </Pressable>
                        <Pressable style={styles.buttonClose} onPress={() => setCreateKidModalVisible(false)}>
                            <Text>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Bottom navigation with icons */}
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
        fontSize: 24,
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
        borderRadius: 10,
        marginVertical: 5,
        width: '50%',
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderColor: '#000',
        borderWidth: 1,
        padding: 10
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5 
    },
    input: {
        marginTop: 10,
        borderWidth: 1,
        width: '50%',
        alignSelf: 'center',
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginBottom: 20
    },
    buttonSave: {
        backgroundColor: '#2196F3' 
    },
    buttonDelete: {
        backgroundColor: '#FF3E3E'
    },
    buttonClose: {
        backgroundColor: '#A8D5BA',
        padding: 10,
        borderRadius: 10
    },
    textStyle: {
        color: 'white',
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
    }
});

export default KidScreen;