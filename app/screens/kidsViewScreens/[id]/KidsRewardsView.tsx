import React, { useEffect, useState } from 'react';
import {
    View,
    Pressable,
    Text,
    Image,
    ActivityIndicator,
    FlatList,
    StyleSheet,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCircleUser } from '@fortawesome/free-solid-svg-icons';
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

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading Kids...</Text>
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
                        <Text style={styles.coinText}>💰 10 Coins</Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    kidHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#A8D5BA',
        padding: 16,
        paddingTop: 48,
        marginBottom: 16,
        flexDirection: 'column'
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
    rewardsButton: {
        backgroundColor: '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
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
