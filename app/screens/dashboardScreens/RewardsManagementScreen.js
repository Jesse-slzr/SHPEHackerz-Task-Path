import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Modal, Pressable, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGift, faPlus, faHouse } from '@fortawesome/free-solid-svg-icons';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../FirebaseConfig';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';
import { useRouter } from 'expo-router';

const RewardsScreen = () => {
    const [rewardName, setRewardName] = useState('');
    const [rewardDescription, setRewardDescription] = useState('');
    const [rewardCost, setRewardCost] = useState('');
    const [rewards, setRewards] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createRewardModalVisible, setCreateRewardModalVisible] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const router = useRouter();

    const addRewardToFirestore = async () => {
        try {
            const rewardId = uuid.v4();
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Rewards'), {
                id: rewardId,
                name: rewardName,
                description: rewardDescription,
                cost: parseFloat(rewardCost),
            });
            setRewards((prevRewards) => [
                ...prevRewards,
                { id: docRef.id, name: rewardName, description: rewardDescription, cost: parseFloat(rewardCost) }
            ]);
            setRewardName('');
            setRewardDescription('');
            setRewardCost('');
            setCreateRewardModalVisible(false);
        } catch (error) {
            console.error("Error adding reward:", error);
        }
    };

    const fetchRewards = async () => {
        try {
            const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Rewards'));
            const fetchedRewards = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRewards(fetchedRewards);
        } catch (error) {
            console.error("Error fetching rewards:", error);
        }
    };

    const updateReward = async (rewardId, updatedName, updatedDescription, updatedCost) => {
        try {
            const rewardRef = doc(FIRESTORE_DB, 'Rewards', rewardId);
            await updateDoc(rewardRef, { name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) });
            setRewards((prevRewards) =>
                prevRewards.map((reward) =>
                    reward.id === rewardId ? { ...reward, name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) } : reward
                )
            );
            setModalVisible(false);
            setSelectedReward(null);
        } catch (error) {
            console.error("Error updating reward:", error);
        }
    };

    const deleteReward = async (rewardId) => {
        try {
            const rewardRef = doc(FIRESTORE_DB, 'Rewards', rewardId);
            await deleteDoc(rewardRef);
            setRewards((prevRewards) => prevRewards.filter((reward) => reward.id !== rewardId));
            setModalVisible(false);
        } catch (error) {
            console.error("Error deleting reward:", error);
        }
    };

    const renderReward = ({ item }) => (
        <Pressable style={styles.rewardItem} onPress={() => openRewardModal(item)}>
            <Text>{item.name}</Text>
        </Pressable>
    );

    const openRewardModal = (reward) => {
        setSelectedReward(reward);
        setModalVisible(true);
    };

    useEffect(() => {
        fetchRewards();
    }, []);

    return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push('/screens/dashboardScreens')} style={styles.headerButton} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                    <FontAwesomeIcon icon={faHouse} size={24} color="black" />
                </Pressable>
            </View>

            <Text style={styles.title}>Manage Rewards</Text>

            <FlatList
                data={rewards}
                keyExtractor={(item) => item.id}
                renderItem={renderReward}
            />

            {/* Reward Edit Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={{ marginBottom: 5, textAlign: 'center' }}>Reward Name:</Text>
                        <TextInput style={styles.input} placeholder="Edit reward name" value={selectedReward ? selectedReward.name : ''} onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, name: text }))} />
                        <Text>Reward Description:</Text>
                        <TextInput style={styles.input} value={selectedReward ? selectedReward.description : ''} onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, description: text }))} />
                        <Text>Reward Cost:</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={selectedReward ? String(selectedReward.cost) : ''} onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, cost: parseFloat(text) }))} />
                        <Pressable style={[styles.button, styles.buttonSave]} onPress={() => updateReward(selectedReward.id, selectedReward.name, selectedReward.description, selectedReward.cost)}>
                            <Text style={styles.textStyle}>Save</Text>
                        </Pressable>
                        <Pressable style={[styles.button, styles.buttonDelete]} onPress={() => deleteReward(selectedReward.id)}>
                            <Text style={styles.textStyle}>Delete</Text>
                        </Pressable>
                        <Pressable style={[styles.button, styles.buttonClose]} onPress={() => setModalVisible(false)}>
                            <Text style={styles.textStyle}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Create Reward Modal */}
            <Modal animationType="slide" transparent={true} visible={createRewardModalVisible} onRequestClose={() => setCreateRewardModalVisible(false)}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Create Reward</Text>
                        <TextInput style={styles.input} placeholder="Reward Name" value={rewardName} onChangeText={setRewardName} />
                        <TextInput style={styles.input} placeholder="Description" value={rewardDescription} onChangeText={setRewardDescription} />
                        <TextInput style={styles.input} placeholder="Cost" keyboardType="numeric" value={rewardCost} onChangeText={setRewardCost} />
                        <Pressable style={[styles.button, styles.buttonSave]} onPress={addRewardToFirestore}>
                            <Text style={styles.textStyle}>Save</Text>
                        </Pressable>
                        <Pressable style={[styles.button, styles.buttonClose]} onPress={() => setCreateRewardModalVisible(false)}>
                            <Text style={styles.textStyle}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <Pressable style={styles.plusButtonStyle} onPress={() => setCreateRewardModalVisible(true)}>
                <FontAwesomeIcon icon={faPlus} size={24} color="black" />
            </Pressable>
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
        alignSelf: 'center'
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
    rewardItem: {
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
        marginVertical: 5,
        alignSelf: 'center'
    },
    buttonSave: {
        backgroundColor: '#2196F3',
    },
    buttonDelete: {
        backgroundColor: '#FF5C5C',
    },
    buttonClose: {
        backgroundColor: '#A8D5BA'
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    plusButtonStyle: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#A8D5BA',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default RewardsScreen;