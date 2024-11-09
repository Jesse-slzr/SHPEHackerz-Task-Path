// KidScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Pressable, Modal, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Link, useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';

const KidScreen = ({ navigation }) => {
    const [KidName, setKidName] = useState('');
    const [KidDescription, setKidDescription] = useState('');
    const [KidCost, setKidCost] = useState('');
    const [Kids, setKids] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createKidModalVisible, setCreateKidModalVisible] = useState(false);
    const [selectedKid, setSelectedKid] = useState(null);
    const router = useRouter();

    const addKidToFirestore = async () => {
        try {
            const KidId = uuid.v4() // Generate unique ID
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Kids'), {
                id: KidId,
                name: KidName,
                description: KidDescription,
                cost: parseFloat(KidCost),
                completed: false
            });
            console.log("Document written with ID: ", docRef.id);
            setKids((prevKids) => [
                ...prevKids,
                { id: docRef.id, name: KidName, description: KidDescription, cost: parseFloat(KidCost), completed: false }
            ]);
            setKidName('');
            setKidDescription('');
            setKidCost('');
            setCreateKidModalVisible(false);   
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const fetchKids = async () => {
        try {
            const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Kids'));
            const fetchedKids = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                cost: doc.data().cost,
                completed: doc.data().completed
            }));
            setKids(fetchedKids);
        } catch (error) {
            console.error('Error fetching Kids:', error);
        }
    };

    const updateKid = async (KidId, updatedName, updatedDescription, updatedCost) => {
        try {
            const KidRef = doc(FIRESTORE_DB, 'Kids', KidId);
            await updateDoc(KidRef, { name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) });
            setKids((prevKids) => prevKids.map((Kid) => 
                Kid.id === KidId ? { ...Kid, name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) } : Kid
            ));
            setModalVisible(false);
            setSelectedKid(null);
            setKidName('');
            setKidDescription('');
            setKidCost('');
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    const deleteKid = async (KidId) => {
        try {
            const KidRef = doc(FIRESTORE_DB, 'Kids', KidId);
            await deleteDoc(KidRef);
            setKids((prevKids) => prevKids.filter((Kid) => Kid.id !== KidId));
            setModalVisible(false);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const renderKid = ({ item }) => (
        <Pressable style={styles.KidItem} onPress={() => openKidModal(item)}>
            <Text>{item.name}</Text>
        </Pressable>
    );

    const openKidModal = (Kid) => {
        setSelectedKid(Kid);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedKid) {
            updateKid(selectedKid.id, selectedKid.name, selectedKid.description, selectedKid.cost);
        }
    };

    const handleDelete = () => {
        if (selectedKid) {
            deleteKid(selectedKid.id);
        }
    };

    useEffect(() => {
        fetchKids();
    }, []);

    return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
            
            {/* Header with settings and navigation to kids view */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push('/screens/dashboardScreens')} style={styles.headerButton} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                    <FontAwesomeIcon icon={faHouse} size={24} color="black" />
                </Pressable>
            </View>

            <Text style={styles.title}>Manage Kids</Text>
            <FlatList
                data={Kids}
                keyExtractor={(item) => item.id}
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
                        <TextInput style={styles.input} placeholder="Edit Kid name" placeholderTextColor="#333" value={selectedKid ? selectedKid.name : ''} onChangeText={(text) => setSelectedKid((prev) => ({ ...prev, name: text }))}/>
                        <Text>Kid Description:</Text>
                        <TextInput style={styles.input} value={selectedKid ? selectedKid.description : ''} onChangeText={(text) => setSelectedKid((prev) => ({ ...prev, description: text }))} />

                        <Text>Kid Cost:</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={selectedKid ? String(selectedKid.cost) : ''} onChangeText={(text) => setSelectedKid((prev) => ({ ...prev, cost: parseFloat(text) }))} />

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
                        <TextInput style={styles.input} placeholder="Kid Name" placeholderTextColor="#333" value={KidName} onChangeText={setKidName} />
                        <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#333" value={KidDescription} onChangeText={setKidDescription} />
                        <TextInput style={styles.input} placeholder="Cost" placeholderTextColor="#333" keyboardType="numeric" value={KidCost} onChangeText={setKidCost} />
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
        backgroundColor: '#A8D5BA',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        alignSelf: 'center',
        paddingTop: 10
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
    KidItem: {
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
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        backgroundColor: '#A8D5BA',
        padding: 16
    },
    buttonContainer: {
        marginVertical: 10,
        borderRadius: 10,
        backgroundColor: '#A8D5BA',
        borderColor: '#fff',
        borderWidth: 3,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '10%',
        alignSelf: 'center'
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
    }
});

export default KidScreen;