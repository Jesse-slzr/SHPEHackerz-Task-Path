import { useLocalSearchParams, router } from 'expo-router';
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
import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, setDoc, query, where, onSnapshot } from 'firebase/firestore';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../../FirebaseConfig';
import uuid from 'react-native-uuid';
import ConfettiCannon from 'react-native-confetti-cannon';

interface Task {
    docId: string;
    taskId: string;
    name: string;
    description: string;
    cost: number;
    completed: boolean;
    duration: number;
    timerType: 'countdown' | 'countup';
}

interface TaskCompletion {
    docId: string;
    taskCompletionId: string;
    kidId: string;
    taskId: string;
    dateCompleted: Date;
    countupDuration?: number;
    countdownDuration?: number;
}

// Function to add task completion to Firestore
const addTaskCompletion = async (kidId: string, taskId: string, countupDuration?: number, countdownDuration?: number) => {
    try {
        // Check if task is already completed for the kid
        const completionsRef = collection(FIRESTORE_DB, 'TaskCompletions');
        const completionQuery = query(
            completionsRef,
            where('kidId', '==', kidId),
            where('taskId', '==', taskId)
        );
        const existingCompletions = await getDocs(completionQuery);

        if (!existingCompletions.empty) {
            console.log('Task already completed!');
            return false; // Avoid duplicate entries
        }

        // Add new task completion
        const generatedId = uuid.v4();
        const completionData: Omit<TaskCompletion, 'docId'> = {
            taskCompletionId: generatedId as string,
            kidId,
            taskId,
            dateCompleted: new Date(),
        };

        if (countupDuration !== undefined) {
            completionData.countupDuration = countupDuration;
            console.log(`Saving countupDuration: ${countupDuration}`);
        }
        if (countdownDuration !== undefined) {
            completionData.countdownDuration = countdownDuration;
            console.log(`Saving countdownDuration: ${countdownDuration}`);
        }

        await addDoc(completionsRef, completionData);

        return true;
    } catch (error) {
        console.error('Error logging task completion:', error);
        return false;
    }
};

// Function to render a task card
const TaskCard: React.FC<{
    task: Task;
    completions: TaskCompletion[];
    setSelectedTask: React.Dispatch<React.SetStateAction<Task & { timeLeft?: number | null } | null>>;
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ task, completions, setSelectedTask, setModalVisible }) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null); // Countdown starts at duration, count-up at 0
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isTimerRunning && timeLeft !== null) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) =>
                    task.timerType === 'countdown'
                        ? prevTime !== null && prevTime > 0 ? prevTime - 1 : 0
                        : prevTime !== null ? prevTime + 1 : 0
                );
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isTimerRunning, task.timerType]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleStartTimer = () => {
        if (timeLeft === null) {
            setTimeLeft(task.timerType === 'countdown' ? task.duration * 60 : 0);
        }
        setIsTimerRunning(true);
        setHasStarted(true);
    };

    const handlePauseTimer = () => {
        setIsTimerRunning(false);
    };

    const handleResetTimer = () => {
        setTimeLeft(null);
        setIsTimerRunning(false);
        setIsFinished(false);
        setHasStarted(false);
    };

    const handleFinishTimer = () => {
        setIsTimerRunning(false);
        setIsFinished(true); 
    };

    // Check if the task is completed by the kid
    const isCompleted = completions.some((completion) => completion.taskId === task.taskId);

    return (
        <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
                <Text style={styles.taskName}>{task.name}</Text>
                {isCompleted ? (
                    <Text style={styles.taskCheck}>✔️</Text>
                ) : task.timerType === 'countdown' && (task.duration === 0 || (timeLeft === 0 && hasStarted)) ? (
                    <Pressable
                        onPress={() => {
                            setSelectedTask({ ...task, timeLeft });
                            setModalVisible(true);
                        }}
                        hitSlop={{ top: 35, bottom: 35, left: 35, right: 35 }}
                    >
                        <Text style={styles.claimText}>Claim</Text>
                    </Pressable>
                ) : task.timerType === 'countup' && isFinished ? (
                    <Pressable
                        onPress={() => {
                            setSelectedTask({ ...task, timeLeft });
                            setModalVisible(true);
                        }}
                        hitSlop={{ top: 35, bottom: 35, left: 35, right: 35 }}
                    >
                        <Text style={styles.claimText}>Claim</Text>
                    </Pressable>
                ) : null}
            </View>
            <Text style={styles.taskDescription}>Description: {task.description}</Text>
            <Text style={styles.taskReward}>💰 {task.cost} Coins</Text>
            
            {!isCompleted && (
                <View style={styles.timerContainer}>
                    {hasStarted && timeLeft !== null && (
                        <Text style={styles.timerText}>
                            ⏳ {formatTime(timeLeft)}
                        </Text>
                    )}
                    <View style={styles.timerButtonsContainer}>
                        {(!hasStarted || (task.timerType === 'countup' && timeLeft === 0 && !isFinished)) ? (
                            <Pressable
                                style={styles.timerButton}
                                onPress={handleStartTimer}
                            >
                                <Text style={styles.timerButtonText}>Start Timer</Text>
                            </Pressable>
                        ) : (
                            <>
                                <Pressable
                                    style={[styles.timerButton, isTimerRunning ? styles.pauseButton : styles.startButton]}
                                    onPress={isTimerRunning ? handlePauseTimer : handleStartTimer}
                                >
                                    <Text style={styles.timerButtonText}>
                                        {isTimerRunning ? 'Pause' : 'Start'}
                                    </Text>
                                </Pressable>
                                {task.timerType === 'countup' && timeLeft !== 0 && !isFinished ? (
                                    <Pressable
                                        style={[styles.timerButton, styles.finishButton]}
                                        onPress={handleFinishTimer}
                                    >
                                        <Text style={styles.timerButtonText}>Finish</Text>
                                    </Pressable>
                                ) : (
                                    <Pressable
                                        style={[styles.timerButton, styles.resetButton]}
                                        onPress={handleResetTimer}
                                    >
                                        <Text style={styles.timerButtonText}>Reset</Text>
                                    </Pressable>
                                )}
                            </>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

const KidScreen = () => {
    const params = useLocalSearchParams<{ id: string; name: string; age: string }>();
    const kidId = params.id;
    const [kidCoins, setKidCoins] = useState<number>(0);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [completions, setCompletions] = useState<TaskCompletion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedTask, setSelectedTask] = useState<Task & { timeLeft?: number | null } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

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
        const fetchData = async () => {
            const tasksRef = collection(FIRESTORE_DB, 'Tasks');
            const completionsRef = collection(FIRESTORE_DB, 'TaskCompletions');
    
            try {
                // Fetching tasks
                const taskSnapshot = await getDocs(tasksRef);
                const fetchedTasks: Task[] = taskSnapshot.docs.map((doc) => ({
                    taskId: doc.data().taskId,
                    ...doc.data(),
                    docId: doc.id,
                } as Task));
    
                // Fetching task completions for the kid
                const completionsQuery = query(completionsRef, where('kidId', '==', kidId));
                const completionsSnapshot = await getDocs(completionsQuery);
    
                const fetchedCompletions: TaskCompletion[] = completionsSnapshot.docs.map((doc) => ({
                    taskCompletionId: doc.data().taskCompletionId,
                    ...doc.data(),
                    docId: doc.id,
                } as TaskCompletion));
    
                // Map completed status to tasks
                const completedTaskIds = fetchedCompletions.map((completion) => completion.taskId);
                const updatedTasks = fetchedTasks.map((task) => ({
                    ...task,
                    completed: completedTaskIds.includes(task.taskId),
                }));
    
                setTasks(updatedTasks);
                setCompletions(fetchedCompletions);
            } catch (error) {
                console.error("Error fetching tasks or completions:", error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchData();
    }, [kidId]);

    useEffect(() => {
        const completionsRef = collection(FIRESTORE_DB, 'TaskCompletions');
        const completionsQuery = query(completionsRef, where('kidId', '==', kidId));

        const unsubscribe = onSnapshot(completionsQuery, (snapshot) => {
            const fetchedCompletions: TaskCompletion[] = snapshot.docs.map((doc) => ({
                taskCompletionId: doc.data().taskCompletionId,
                ...doc.data(),
                docId: doc.id,
            } as TaskCompletion));
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
                await setDoc(kidDoc.ref, { coinCount: currentCoins + incrementBy }, { merge: true });
            }
        } catch (error) {
            console.error('Error updating coin count:', error);
        }
    };

    const handleClaimTask = async () => {
        if (!selectedTask ) return;
    
        try {
            const durationToRecord = // Recorded in seconds
                selectedTask.timerType === 'countup'
                    ? selectedTask.timeLeft
                    : selectedTask.duration * 60;

            const success = await addTaskCompletion(
                kidId,
                selectedTask.taskId,
                selectedTask.timerType === 'countup' ? durationToRecord ?? undefined  : undefined,
                selectedTask.timerType === 'countdown' ? durationToRecord ?? undefined  : undefined
            );
    
            if (success) {
                setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                        task.taskId === selectedTask.taskId ? { ...task, completed: true } : task
                    )
                );

                await updateCoinCount(kidId, selectedTask.cost);
                setShowConfetti(true); // Trigger confetti
                setTimeout(() => {
                    setShowConfetti(false); // Hide confetti after 2 seconds
                    setModalVisible(false); // Close modal after confetti
                    setSelectedTask(null);
                }, 1000);
            } else {
                console.log('Task claim failed, closing modal...');
                setModalVisible(false);
                setSelectedTask(null);
            }
        } catch (error) {
            console.error('Error claiming task:', error);
            setModalVisible(false);
            setSelectedTask(null);
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

            {/* Task List */}
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.taskId || item.docId}
                renderItem={({ item }) => (
                    <TaskCard
                        task={item}
                        completions={completions}
                        setSelectedTask={setSelectedTask}
                        setModalVisible={setModalVisible}
                    />
                )}
            />

            {/* Claim Task Modal */}
            {/* Updated Claim Task Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            🎉 Awesome Job! 🎉
                        </Text>
                        <Text style={styles.modalText}>
                            Want to claim <Text style={styles.modalTaskName}>{selectedTask?.name}</Text> and grab your coins? 💰
                        </Text>
                        <View style={styles.modalButtons}>
                            <Pressable style={[styles.modalButton, styles.yesButton]} onPress={handleClaimTask}>
                                <Text style={styles.modalButtonText}>Yes! 🚀</Text>
                            </Pressable>
                            <Pressable style={[styles.modalButton, styles.noButton]} onPress={() => { setModalVisible(false); setSelectedTask(null); }}>
                                <Text style={styles.modalButtonText}>Nah 😛</Text>
                            </Pressable>
                        </View>
                    </View>
                    {showConfetti && (
                        <ConfettiCannon
                            count={100}
                            origin={{ x: 150, y: -100 }}
                            autoStart={true}
                            fadeOut={true}
                            explosionSpeed={300}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

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
    tasksButton: {
        backgroundColor: '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskCard: {
        backgroundColor: '#A8D5BA',
        padding: 16,
        marginBottom: 16,
        borderRadius: 10,
        elevation: 2,
        width: '90%',
        alignSelf: 'center',
    },
    timerContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    timerText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    timerButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    timerButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        minWidth: 120,
        alignItems: 'center',
    },
    timerButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    startButton: {
        backgroundColor: '#4CAF50',
    },
    pauseButton: {
        backgroundColor: '#f44336',
    },
    resetButton: {
        backgroundColor: '#2196F3',
    },
    finishButton: {
        backgroundColor: '#FF9800',
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
    claimText: { 
        color: 'white', 
        fontWeight: 'bold' 
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Slightly darker overlay for contrast
    },
    modalContent: {
        backgroundColor: '#A8D5BA', // Bright gold background
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
    modalText: {
        fontSize: 20,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalTaskName: {
        fontWeight: 'bold',
        color: '#2196F3',
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
        borderColor: '#000'
    },
    yesButton: {
        backgroundColor: '#4CAF50', // Lime green for "Yes"
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    noButton: {
        backgroundColor: '#f44336', // Hot pink for "No"
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    modalButtonText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default KidScreen;
