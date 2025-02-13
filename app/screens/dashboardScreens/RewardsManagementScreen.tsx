// RewardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet, Pressable, Modal, KeyboardAvoidingView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';

interface Reward {
    docId: string;
    rewardId: string;
    name: string;
    description: string;
    cost: number;
    claimed: boolean;
    childId: string;
}

const RewardScreen = () => {
    const [rewardName, setRewardName] = useState('');
    const [rewardDescription, setRewardDescription] = useState('');
    const [rewardCost, setRewardCost] = useState('');
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createRewardModalVisible, setCreateRewardModalVisible] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    
    useEffect(() => {
        fetchRewards();
    }, []);

    const addRewardToFirestore = async () => {
        try {
            const rewardId = uuid.v4() // Generate unique ID
            const newReward = {
                rewardId: rewardId,
                name: rewardName,
                description: rewardDescription,
                cost: parseFloat(rewardCost) || 0,
                claimed: false,
                childId: ""
            };
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Rewards'), newReward);
            setRewards((prevRewards) => [...prevRewards, { ...newReward, docId: docRef.id }]);
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
            const fetchedRewards: Reward[] = querySnapshot.docs.map((doc) => ({
                rewardId: doc.data().rewardId,
                ...doc.data(),
                docId: doc.id
            } as Reward));
            setRewards(fetchedRewards);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Rewards:', error);
        }
    };

    const updateReward = async (reward: Reward,rewardId: string, updatedName: string, updatedDescription: string, updatedCost: string) => {
        try {
            const rewardRef = doc(FIRESTORE_DB, 'Rewards', reward.docId);
            await updateDoc(rewardRef, {
                name: updatedName,
                description: updatedDescription,
                cost: parseFloat(updatedCost) || 0
            });
            setRewards((prevRewards) => prevRewards.map((reward) => 
                reward.rewardId === rewardId
                    ? { ...reward, name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) }
                    : reward
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

    const deleteReward = async (reward: Reward) => {
        try {
            const rewardRef = doc(FIRESTORE_DB, 'Rewards', reward.docId);
            await deleteDoc(rewardRef);
            setRewards((prevRewards) => prevRewards.filter((prevReward) => prevReward.docId !== reward.docId));
            setModalVisible(false);
            setSelectedReward(null);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const renderReward = ({ item }: { item: Reward}) => (
        <Pressable style={styles.rewardItem} onPress={() => openRewardModal(item)}>
            <Text>{item.name}</Text>
            <Pressable onPress={() => deleteReward(item)}>
                <FontAwesome name="trash" size={20} color="red" />
            </Pressable>
        </Pressable>
    );

    const openRewardModal = (reward: Reward) => {
        setSelectedReward(reward);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedReward) {
            updateReward(selectedReward, selectedReward.rewardId, selectedReward.name, selectedReward.description, selectedReward.cost.toString());
        }
    };

    const handleDelete = () => {
        if (selectedReward) {
            deleteReward(selectedReward);
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

            <Text style={styles.title}>Manage Rewards</Text>
            <FlatList
                data={rewards}
                keyExtractor={(item) => item.rewardId || item.docId}
                renderItem={renderReward}
            />

            {/* Edit Reward Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalView}>
                        <Pressable onPress={() => setModalVisible(false)} style={styles.closeXButton}>
                            <FontAwesome name="close" size={24} color="black" />
                        </Pressable>

                        <Text style={styles.modalTitle}>Edit Reward</Text>
                        
                        <Text style={styles.modalSubTitle}>Name:</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="Edit Reward name"
                            placeholderTextColor="#333"
                            value={selectedReward ? selectedReward.name : ''}
                            onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, name: text }) as Reward | null)}
                        />

                        <Text style={styles.modalSubTitle}>Description:</Text>
                        <TextInput
                            style={styles.input}
                            value={selectedReward ? selectedReward.description : ''}
                            onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, description: text }) as Reward | null)}
                        />

                        <Text style={styles.modalSubTitle}>Cost:</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric"
                            value={selectedReward ? String(selectedReward.cost) : ''}
                            onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, cost: parseFloat(text) }) as Reward | null)}
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

            <Pressable style={styles.plusButtonStyle} onPress={() => setCreateRewardModalVisible(true)}>
                <FontAwesome name="plus" size={12} color="black" />
            </Pressable>

            {/* Create Reward Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={createRewardModalVisible}
                onRequestClose={() => setCreateRewardModalVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalView}>
                        <Pressable onPress={() => setCreateRewardModalVisible(false)} style={styles.closeXButton}>
                            <FontAwesome name="close" size={24} color="black" />
                        </Pressable>
                        <Text style={styles.modalTitle}>Create Reward</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Reward Name"
                            placeholderTextColor="#333"
                            value={rewardName}
                            onChangeText={setRewardName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Description"
                            placeholderTextColor="#333"
                            value={rewardDescription}
                            onChangeText={setRewardDescription}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Cost (# of Coins)"
                            placeholderTextColor="#333"
                            keyboardType="numeric"
                            value={rewardCost}
                            onChangeText={setRewardCost}
                        />
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
    rewardItem: {
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
    rewardName: {
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
        backgroundColor: '#2196F3' 
    },
    buttonDelete: {
        backgroundColor: '#FF3B30'
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

export default RewardScreen;