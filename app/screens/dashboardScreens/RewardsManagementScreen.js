// RewardScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Pressable, Modal, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';

const RewardScreen = ({ navigation }) => {
    const [RewardName, setRewardName] = useState('');
    const [RewardDescription, setRewardDescription] = useState('');
    const [RewardCost, setRewardCost] = useState('');
    const [Rewards, setRewards] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createRewardModalVisible, setCreateRewardModalVisible] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const router = useRouter();

    const addRewardToFirestore = async () => {
        try {
            const RewardId = uuid.v4() // Generate unique ID
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Rewards'), {
                id: RewardId,
                name: RewardName,
                description: RewardDescription,
                cost: parseFloat(RewardCost),
                completed: false
            });
            console.log("Document written with ID: ", docRef.id);
            setRewards((prevRewards) => [
                ...prevRewards,
                { id: docRef.id, name: RewardName, description: RewardDescription, cost: parseFloat(RewardCost), completed: false }
            ]);
            setRewardName('');
            setRewardDescription('');
            setRewardCost('');
            setCreateRewardModalVisible(false);   
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const fetchRewards = async () => {
        try {
            const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Rewards'));
            const fetchedRewards = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                cost: doc.data().cost,
                completed: doc.data().completed
            }));
            setRewards(fetchedRewards);
        } catch (error) {
            console.error('Error fetching Rewards:', error);
        }
    };

    const updateReward = async (RewardId, updatedName, updatedDescription, updatedCost) => {
        try {
            const RewardRef = doc(FIRESTORE_DB, 'Rewards', RewardId);
            await updateDoc(RewardRef, { name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) });
            setRewards((prevRewards) => prevRewards.map((Reward) => 
                Reward.id === RewardId ? { ...Reward, name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) } : Reward
            ));
            setModalVisible(false);
            setSelectedReward(null);
            setRewardName('');
            setRewardDescription('');
            setRewardCost('');
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    const deleteReward = async (RewardId) => {
        try {
            const RewardRef = doc(FIRESTORE_DB, 'Rewards', RewardId);
            await deleteDoc(RewardRef);
            setRewards((prevRewards) => prevRewards.filter((Reward) => Reward.id !== RewardId));
            setModalVisible(false);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const renderReward = ({ item }) => (
        <Pressable style={styles.RewardItem} onPress={() => openRewardModal(item)}>
            <Text>{item.name}</Text>
        </Pressable>
    );

    const openRewardModal = (Reward) => {
        setSelectedReward(Reward);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedReward) {
            updateReward(selectedReward.id, selectedReward.name, selectedReward.description, selectedReward.cost);
        }
    };

    const handleDelete = () => {
        if (selectedReward) {
            deleteReward(selectedReward.id);
        }
    };

    useEffect(() => {
        fetchRewards();
    }, []);

    return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
            
            {/* Header with settings and navigation to kids view */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push('/screens/dashboardScreens')} style={styles.headerButton} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                    <FontAwesomeIcon icon={faHouse} size={24} color="black" />
                </Pressable>
            </View>

            <Text style={styles.title}>Manage Rewards</Text>
            <FlatList
                data={Rewards}
                keyExtractor={(item) => item.id}
                renderItem={renderReward}
            />
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={{ marginBottom: 5, textAlign: 'center' }}>Reward Name:</Text>
                        <TextInput style={styles.input} placeholder="Edit Reward name" placeholderTextColor="#333" value={selectedReward ? selectedReward.name : ''} onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, name: text }))}/>
                        <Text>Reward Description:</Text>
                        <TextInput style={styles.input} value={selectedReward ? selectedReward.description : ''} onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, description: text }))} />

                        <Text>Reward Cost:</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={selectedReward ? String(selectedReward.cost) : ''} onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, cost: parseFloat(text) }))} />

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

            <Pressable style={styles.plusButtonStyle} onPress={() => setCreateRewardModalVisible(true)}>
                <FontAwesome name="plus" size={12} color="black" />
            </Pressable>

            {/* Create Reward Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createRewardModalVisible}
                onRequestClose={() => setCreateRewardModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={{ marginVertical: 5, textAlign: 'center', fontWeight: 'bold' }}>Create Reward</Text>
                        <TextInput style={styles.input} placeholder="Reward Name" placeholderTextColor="#333" value={RewardName} onChangeText={setRewardName} />
                        <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#333" value={RewardDescription} onChangeText={setRewardDescription} />
                        <TextInput style={styles.input} placeholder="Cost" placeholderTextColor="#333" keyboardType="numeric" value={RewardCost} onChangeText={setRewardCost} />
                        <Pressable style={styles.plusButtonStyle} onPress={addRewardToFirestore}>
                            <FontAwesome name="plus" size={12} color="black" />
                        </Pressable>
                        <Pressable style={styles.buttonClose} onPress={() => setCreateRewardModalVisible(false)}>
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
    RewardItem: {
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

export default RewardScreen;