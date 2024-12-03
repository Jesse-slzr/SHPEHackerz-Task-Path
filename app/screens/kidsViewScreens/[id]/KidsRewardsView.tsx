import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../../FirebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface Reward {
    id: string,
    name: string,
    description: string,
    cost: number,
    completed: boolean
}

const KidsRewardsView = () => {
    const params = useLocalSearchParams<{ id: string, name: string, age: string, completed: string }>();
    const kidId = params.id;
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchRewards();
    }, [kidId]);
    
    const fetchRewards = async () => {
        try {
            const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Rewards'));
            const fetchedRewards = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                cost: doc.data().cost,
                completed: doc.data().completed,
        }));
        setRewards(fetchedRewards);
        } catch (error) {
            console.error('Error fetching rewards:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.kidName}>{params.name}</Text>
                    <Text style={styles.coinText}>💰 10 Coins</Text>
                </View>
                <Image
                    source={{ uri: 'https://via.placeholder.com/80' }}
                    style={styles.avatar}
                />
            </View>

            {/* Button Section */}
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
            
            {/* Rewards List */}
            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <FlatList
                    data={rewards}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.rewardCard}>
                            <View style={styles.rewardHeader}>
                                <Text style={styles.rewardName}>{item.name}</Text>
                                <Text style={styles.rewardCheck}>X</Text>
                            </View>
                            <Text style={styles.rewardDescription}>Description: {item.description}</Text>
                            <Text style={styles.rewardCost}>💰 {item.cost} Coins</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#A8D5BA',
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
    },
    kidName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    coinText: {
        fontSize: 16,
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
        borderRadius: 20,
        alignItems: 'center',
        elevation: 2,
    },
    rewardsButton: {
        backgroundColor: '#D9FAD9',
    },
    tasksButton: {
        backgroundColor: '#A8D5BA',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    rewardCard: {
        backgroundColor: '#D9FAD9',
        padding: 16,
        marginBottom: 16,
        borderRadius: 10,
        elevation: 2,
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
    rewardDescription: {
        fontSize: 16,
        marginBottom: 8,
    },
    rewardCost: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
});

export default KidsRewardsView;
