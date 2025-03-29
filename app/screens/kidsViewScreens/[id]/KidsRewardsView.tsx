import React, { useEffect, useState } from 'react';
import {
    View,
    Pressable,
    Text,
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { collection, getDocs, addDoc, setDoc, query, where, onSnapshot } from 'firebase/firestore';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../../FirebaseConfig';
import uuid from 'react-native-uuid';

interface Reward {
    docId: string;
    rewardId: string;
    name: string;
    description: string;
    cost: number;
    completed: boolean;
    childIds: string[];
}

interface RewardCompletion {
    docId: string;
    rewardCompletionId: string;
    kidId: string;
    rewardId: string;
    dateCompleted: Date;
}

// Function to add reward completion to Firestore
const addRewardCompletion = async (kidId: string, rewardId: string) => {
    if (!kidId || !rewardId) {
        console.error("Invalid kidId or rewardId:", { kidId, rewardId });
        return false;
    }
    try {
        // Check if reward is already completed for the kid
        const completionsRef = collection(FIRESTORE_DB, 'RewardCompletions');
        const completionQuery = query(
            completionsRef,
            where('kidId', '==', kidId),
            where('rewardId', '==', rewardId)
        );
        const existingCompletions = await getDocs(completionQuery);

        if (!existingCompletions.empty) {
            console.log('Task already completed!');
            return false; // Avoid duplicate entries
        }

        // Add new task completion
        const generatedId = uuid.v4()
        await addDoc(completionsRef, {
            rewardCompletionId: generatedId,
            kidId,
            rewardId,
            dateCompleted: new Date(), // Timestamp of completion
        });

        return true;
    } catch (error) {
        console.error('Error logging reward completion:', error);
        return false;
    }
};

// Function to render a reward card
const renderRewardCard = (
    reward: Reward,
    completions: RewardCompletion[],
    styles: any,
    setSelectedReward: React.Dispatch<React.SetStateAction<Reward | null>>,
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => {
    // Check if the task is completed by the kid
    const isCompleted = completions.some((completion) => completion.rewardId === reward.rewardId);

    return (
        <View style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
                <Text style={styles.rewardName}>{reward.name}</Text>
                {isCompleted ? (
                    <Text style={styles.rewardCheck}>✔️</Text>
                ) : (
                    <Pressable
                        onPress={() => {
                            setSelectedReward(reward);
                            setModalVisible(true);
                        }}
                        hitSlop={{ top: 35, bottom: 35, left: 35, right: 35 }}
                    >
                        <Text style={styles.claimText}>Redeem</Text>
                    </Pressable>
                )}
            </View>
            <Text style={styles.rewardDescription}>Description: {reward.description}</Text>
            <Text style={styles.rewardCost}>💰 {reward.cost} Coins</Text>
        </View>
    );
};

const KidsRewardsView = () => {
    const params = useLocalSearchParams<{ id: string, name: string, age: string, completed: string }>();
    const kidId = params.id;
    const [kidCoins, setKidCoins] = useState<number>(0);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [completions, setCompletions] = useState<RewardCompletion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

    useEffect(() => {
        const kidRef = collection(FIRESTORE_DB, 'Kids');
        const kidQuery = query(kidRef, where('kidId', '==', kidId));
    
        const unsubscribe = onSnapshot(kidQuery, (snapshot) => {
            if (!snapshot.empty) {
                const kidData = snapshot.docs[0].data();
                setKidCoins(kidData.coinCount || 0); // Update the state in real-time
            }
        });
    
        return unsubscribe; // Cleanup the listener on unmount
    }, [kidId]);

    useEffect(() => {
        // Reset state when kidId changes
        setRewards([]); 
        setCompletions([]); 
        setLoading(true);

        const fetchData = async () => {
            const rewardsRef = collection(FIRESTORE_DB, 'Rewards');
            const completionsRef = collection(FIRESTORE_DB, 'RewardCompletions');
    
            try {
                // Fetching rewards
                const rewardSnapshot = await getDocs(rewardsRef);
                const fetchedRewards: Reward[] = rewardSnapshot.docs.map((doc) => ({
                    rewardId: doc.data().rewardId,
                    ...doc.data(),
                    docId: doc.id,
                } as Reward));

                // Filter rewards to only those assigned to this kid
                const kidAssignedRewards = fetchedRewards.filter((reward) =>
                    reward.childIds.includes(kidId)
                );
    
                // Fetching reward completions for the kid
                const completionsQuery = query(completionsRef, where('kidId', '==', kidId));
                const completionsSnapshot = await getDocs(completionsQuery);
    
                const fetchedCompletions: RewardCompletion[] = completionsSnapshot.docs.map((doc) => ({
                    rewardCompletionId: doc.data().rewardCompletionId,
                    ...doc.data(),
                    docId: doc.id,
                } as RewardCompletion));
    
                // Map completed status to rewards
                const completedRewardIds = fetchedCompletions.map((completion) => completion.rewardId);
                const updatedRewards = kidAssignedRewards.map((reward) => ({
                    ...reward,
                    completed: completedRewardIds.includes(reward.rewardId),
                }));
    
                setRewards(updatedRewards);
                setCompletions(fetchedCompletions);
            } catch (error) {
                console.error("Error fetching rewards or completions:", error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchData();
    }, [kidId]);

    useEffect(() => {
        const completionsRef = collection(FIRESTORE_DB, 'RewardCompletions');
        const completionsQuery = query(completionsRef, where('kidId', '==', kidId));

        const unsubscribe = onSnapshot(completionsQuery, (snapshot) => {
            const fetchedCompletions: RewardCompletion[] = snapshot.docs.map((doc) => ({
                rewardCompletionId: doc.data().rewardCompletionId,
                ...doc.data(),
                docId: doc.id,
            } as RewardCompletion));
            setCompletions(fetchedCompletions);
        });

        return unsubscribe;
    }, [kidId]);

    const updateCoinCount = async (kidId: string, incrementBy: number) => {
        try {
            const kidRef = collection(FIRESTORE_DB, 'Kids');
            const kidQuery = query(kidRef, where('kidId', '==', kidId));
            const kidSnapshot = await getDocs(kidQuery);
    
            if (!kidSnapshot.empty) {
                const kidDoc = kidSnapshot.docs[0]; // Assuming `kidId` is unique
                const currentCoins = kidDoc.data().coinCount || 0;
    
                // Update coin count
                await setDoc(kidDoc.ref, { coinCount: currentCoins - incrementBy }, { merge: true });
            }
        } catch (error) {
            console.error('Error updating coin count:', error);
        }
    };
    
    const handleClaimReward = async () => {
        // setSelectedReward(reward);
        if (!selectedReward) return;
        
        if (kidCoins < selectedReward.cost) {
            alert('Not enough coins to claim this reward!');
            setModalVisible(false);
            setSelectedReward(null);
            return;
        }

        try {
            const success = await addRewardCompletion(kidId, selectedReward.rewardId);
    
            if (success) {
                setRewards((prevRewards) =>
                    prevRewards.map((reward) =>
                        reward.rewardId === selectedReward.rewardId ? { ...reward, completed: true } : reward
                    )
                );

                await updateCoinCount(kidId, selectedReward.cost);
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
        } finally {
            setModalVisible(false);
            setSelectedReward(null);
        }
    };

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A8D5BA" />
            <Text>Loading Rewards...</Text>
        </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Kid Info Header Section */}  
            <View style={styles.header}>
                <View style={styles.kidHeader}>
                    <Pressable onPress={() => router.push({pathname: '/screens/kidsViewScreens', params: { id: params.id, name: params.name }})} style={styles.headerButton} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                        <FontAwesomeIcon icon={faArrowLeft} size={24} color="black" />
                    </Pressable>
                    <View>
                        <Text style={styles.kidName}>{params.name}</Text>
                        <Text style={styles.coinText}>💰 {kidCoins} Coins</Text>
                    </View>
                    <FontAwesomeIcon icon={faCircleUser} size={80} color="black" />
                </View>
                
                {/* Rewards/Tasks Button Section */}
                <View style={styles.buttonContainer}>
                    <Pressable
                        style={[styles.button, styles.rewardsButton]}
                        onPress={() =>
                            router.push({
                            pathname: '/screens/kidsViewScreens/[id]/KidsRewardsView',
                            params: { id: params.id, name: params.name },
                            })
                        }
                    >
                        <Text style={styles.buttonText}>Rewards</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.button, styles.tasksButton]}
                        onPress={() =>
                            router.push({
                            pathname: '/screens/kidsViewScreens/[id]',
                            params: { id: params.id, name: params.name },
                            })
                        }
                    >
                        <Text style={styles.buttonText}>Tasks</Text>
                    </Pressable>
                </View>
            </View>
            
            {/* Rewards List */}
            <FlatList
                data={rewards}
                keyExtractor={(item) => item.rewardId || item.docId}
                renderItem={({ item }) =>
                    renderRewardCard(item, completions, styles, setSelectedReward, setModalVisible)
                }
            />

            {/* Claim Task Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>🎉 Great Choice! 🎉</Text>
                        <Text style={styles.modalClaimText}>
                            Want to redeem <Text style={styles.modalRewardName}>{selectedReward?.name}</Text> for {selectedReward?.cost} coins? 💰
                        </Text>
                        <View style={styles.modalButtons}>
                            <Pressable style={[styles.modalButton, styles.yesButton]} onPress={handleClaimReward}>
                                <Text style={styles.modalButtonText}>Yes!</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.noButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setSelectedReward(null);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Nah</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#A8D5BA',
        padding: 16,
        paddingTop: 48,
        marginBottom: 16,
        flexDirection: 'column'
    },
    kidHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#A8D5BA',
        padding: 8,
        borderRadius: 50,
    },
    kidName: {
        marginTop: 55,
        left: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    coinText: {
        fontSize: 16,
        marginTop: 5,
        left: 10,
        color: '#666',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ccc',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
      },
    button: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 8,
        marginTop: 10,
        borderRadius: 20,
        borderColor: '#000',
        borderWidth: 2,
        alignItems: 'center',
        elevation: 2,
    },
    tasksButton: {
        backgroundColor: '#A8D5BA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    rewardsButton: {
        backgroundColor: '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardCard: {
        backgroundColor: '#A8D5BA',
        padding: 16,
        marginBottom: 16,
        borderRadius: 10,
        elevation: 2,
        width: '90%',
        alignSelf: 'center',
    },
    rewardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rewardName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    rewardCheck: {
        fontSize: 18,
        color: '#4CAF50',
    },
    claimText: { 
        color: 'white', 
        fontWeight: 'bold' 
    },
    rewardDescription: {
        fontSize: 16,
        marginBottom: 8,
    },
    rewardCost: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        backgroundColor: '#A8D5BA',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
        borderWidth: 3,
        borderColor: '#4CAF50',
        width: '85%',
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    modalClaimText: { 
        fontSize: 20,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalRewardName: {
        fontWeight: 'bold',
        color: '#FFF',
    },
    modalRewardText: {
        fontSize: 30,
        marginBottom: 20,
        textAlign: 'center',
        color: '#fff',
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#000',
    },
    yesButton: {
        backgroundColor: '#4CAF50',
        borderColor: '#FFFFFF',
    },
    noButton: {
        backgroundColor: '#f44336',
        borderColor: '#FFFFFF',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default KidsRewardsView;
