import { useLocalSearchParams, router } from 'expo-router';
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
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../../FirebaseConfig';

interface Task {
    id: string;
    name: string;
    description: string;
    cost: number;
    completed: boolean;
}

const KidScreen = () => {
    const params = useLocalSearchParams<{ id: string; name: string; age: string }>();
    const kidId = params.id;
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchTasks();
    }, [kidId]);

    const fetchTasks = async () => {
        try {
            const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Tasks'));
                const fetchedTasks = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                cost: doc.data().cost,
                completed: doc.data().completed,
            }));
            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
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
        <View style={styles.container}>
            {/* Kid Info Header Section */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push({pathname: '/screens/kidsViewScreens', params: { id: params.id, name: params.name }})} style={styles.headerButton} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                    <FontAwesomeIcon icon={faArrowLeft} size={24} color="black" />
                </Pressable>
            </View>

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

            {/* Task List */}
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                        <Text style={styles.taskName}>{item.name}</Text>
                        <Text style={styles.taskCheck}>✔️</Text>
                    </View>
                    <Text style={styles.taskDescription}>Description: {item.description}</Text>
                    <Text style={styles.taskReward}>💰 {item.cost} Coins</Text>
                    </View>
                )}
            />
        </View>
    );
};

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
    headerButton: {
        backgroundColor: '#A8D5BA',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
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
    rewardsButton: {
        backgroundColor: '#A8D5BA',
    },
    tasksButton: {
        backgroundColor: '#D9FAD9',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 8,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 2,
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
    taskCard: {
        backgroundColor: '#D9FAD9',
        padding: 16,
        marginBottom: 16,
        borderRadius: 10,
        elevation: 2,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    taskName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    taskCheck: {
        fontSize: 18,
        color: '#4CAF50',
    },
    taskDescription: {
        fontSize: 16,
        marginBottom: 8,
    },
    taskReward: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
});

export default KidScreen;
