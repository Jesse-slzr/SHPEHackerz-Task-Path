// RewardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet, Pressable, Modal, Keyboard, KeyboardAvoidingView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import uuid from 'react-native-uuid';
import {Swipeable, GestureHandlerRootView,} from 'react-native-gesture-handler';

interface Kid {
    docId: string;
    kidId: string;
    name: string;
    age: number;
    coinCount: number;
    parentUuid: string;
}

interface Reward {
    docId: string;
    rewardId: string;
    name: string;
    description: string;
    cost: number;
    claimed: boolean;
    childIds: string[];
    parentUuid: string;
}

const RewardScreen = () => {
    const [rewardName, setRewardName] = useState('');
    const [rewardDescription, setRewardDescription] = useState('');
    const [rewardCost, setRewardCost] = useState('');
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [kids, setKids] = useState<Kid[]>([]);
    const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createRewardModalVisible, setCreateRewardModalVisible] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    
    useEffect(() => {
        fetchRewards();
        fetchKids();
    }, []);

    const fetchKids = async () => {
        try {
            const auth = getAuth();
            const parentUuid = auth.currentUser?.uid || '';
            const querySnapshot = await getDocs(query(collection(FIRESTORE_DB, 'Kids'), where('parentUuid', '==', parentUuid)));
            const fetchedKids: Kid[] = querySnapshot.docs.map((doc) => ({
                kidId: doc.data().kidId,
                ...doc.data(),
                docId: doc.id,
            } as Kid));
            setKids(fetchedKids);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching kids:', error);
        }
    };

    const addRewardToFirestore = async () => {
        try {
            const rewardId = uuid.v4() // Generate unique ID
            const newReward = {
                rewardId: rewardId as string,
                name: rewardName,
                description: rewardDescription,
                cost: parseFloat(rewardCost),
                claimed: false,
                childIds: selectedChildIds,
                parentUuid: getAuth().currentUser?.uid ?? ''
            };
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Rewards'), newReward);
            setRewards((prevRewards) => [...prevRewards, { ...newReward, docId: docRef.id }]);
            setRewardName('');
            setRewardDescription('');
            setRewardCost('');
            setSelectedChildIds([]);
            setCreateRewardModalVisible(false);   
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const fetchRewards = async () => {
        try {
            const auth = getAuth();
            const parentUuid = auth.currentUser?.uid || '';
            const q = query(
                collection(FIRESTORE_DB, 'Rewards'),
                where('parentUuid', '==', parentUuid)
            );
            const querySnapshot = await getDocs(q);
            const fetchedRewards: Reward[] = querySnapshot.docs.map((doc) => ({
                rewardId: doc.data().rewardId,
                childIds: doc.data().childIds || [],
                ...doc.data(),
                docId: doc.id
            } as Reward));
            setRewards(fetchedRewards);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Rewards:', error);
        }
    };

    const updateReward = async (reward: Reward) => {
        try {
            const rewardRef = doc(FIRESTORE_DB, 'Rewards', reward.docId);
            await updateDoc(rewardRef, {
                name: reward.name,
                description: reward.description,
                cost: reward.cost,
                childIds: reward.childIds,
            });
            setRewards((prevRewards) => prevRewards.map((r) => 
                r.rewardId === reward.rewardId ? { ...reward } : r
            ));
            setModalVisible(false);
            setSelectedReward(null);
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

    const renderReward = ({ item }: { item: Reward }) => {
        const renderRightActions = () => (
            <Pressable style={styles.deleteButton} onPress={() => deleteReward(item)}>
                <FontAwesome name="trash" size={20} color="white" />
                <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
        );
    
        return (
            <Swipeable renderRightActions={renderRightActions}>
                <Pressable style={styles.rewardItem} onPress={() => openRewardModal(item)}>
                    <View style={styles.rewardContent}>
                        <Text style={styles.rewardName}>{item.name}</Text>
                        <View style={styles.kidBubblesContainer}>
                            {item.childIds.length > 0 ? (
                                item.childIds
                                    .filter((id) => kids.find((k) => k.kidId === id)) // Filter valid kidIds
                                    .map((id) => {
                                        const kid = kids.find((k) => k.kidId === id);
                                        return (
                                            <View key={id} style={styles.kidBubble}>
                                                <Text style={styles.kidBubbleText}>
                                                    {kid?.name || 'Unknown'}
                                                </Text>
                                            </View>
                                        );
                                    })
                            ) : (
                                <View style={[styles.kidBubble, styles.noneBubble]}>
                                    <Text style={styles.kidBubbleText}>None</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Pressable>
            </Swipeable>
        );
    };

    const openRewardModal = (reward: Reward) => {
        setSelectedReward(reward);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedReward) {
            updateReward(selectedReward);
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
            <ActivityIndicator size="large" color="#A8D5BA" />
            <Text>Loading...</Text>
        </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}> 
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
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />

                            <Text style={styles.modalSubTitle}>Description:</Text>
                            <TextInput
                                style={styles.input}
                                value={selectedReward ? selectedReward.description : ''}
                                onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, description: text }) as Reward | null)}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />

                            <Text style={styles.modalSubTitle}>Cost:</Text>
                            <TextInput 
                                style={styles.input} 
                                keyboardType="numeric"
                                value={selectedReward ? String(selectedReward.cost) : ''}
                                onChangeText={(text) => setSelectedReward((prev) => ({ ...prev, cost: parseFloat(text) }) as Reward | null)}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />

                            {/* Child Selection for Edit */}
                            <Text style={styles.modalSubTitle}>Assign to Kids:</Text>
                            {kids.map((kid) => (
                                <View key={kid.kidId} style={styles.checkboxContainer}>
                                <Pressable
                                    onPress={() => {
                                    const updatedChildIds = selectedReward?.childIds.includes(kid.kidId)
                                        ? selectedReward.childIds.filter((id) => id !== kid.kidId)
                                        : [...(selectedReward?.childIds || []), kid.kidId];
                                    setSelectedReward((prev) => prev ? { ...prev, childIds: updatedChildIds } : null);
                                    }}
                                    style={styles.checkbox}
                                >
                                    <Text>{selectedReward?.childIds.includes(kid.kidId) ? '✓' : ' '}</Text>
                                </Pressable>
                                <Text>{kid.name}</Text>
                                </View>
                            ))}

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
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Description"
                                placeholderTextColor="#333"
                                value={rewardDescription}
                                onChangeText={setRewardDescription}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Cost (# of Coins)"
                                placeholderTextColor="#333"
                                keyboardType="numeric"
                                value={rewardCost}
                                onChangeText={setRewardCost}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />

                            {/* Child Selection for Creation */}
                            <Text style={styles.modalSubTitle}>Assign to Kids:</Text>
                            {kids.map((kid) => (
                                <View key={kid.kidId} style={styles.checkboxContainer}>
                                <Pressable
                                    onPress={() => {
                                    const updatedChildIds = selectedChildIds.includes(kid.kidId)
                                        ? selectedChildIds.filter((id) => id !== kid.kidId)
                                        : [...selectedChildIds, kid.kidId];
                                    setSelectedChildIds(updatedChildIds);
                                    }}
                                    style={styles.checkbox}
                                >
                                    <Text>{selectedChildIds.includes(kid.kidId) ? '✓' : ' '}</Text>
                                </Pressable>
                                <Text>{kid.name}</Text>
                                </View>
                            ))}

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
    rewardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    rewardName: {
        fontSize: 16,
        marginRight: 10,
    },
    kidBubblesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    kidBubble: {
        backgroundColor: '#A8D5BA',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginRight: 5,
        marginTop: 2,
    },
    noneBubble: {
        backgroundColor: '#CCCCCC', // Grey color for "None"
    },
    kidBubbleText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
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
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
      },
      checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
      },
});

export default RewardScreen;
