// TaskScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet, Pressable, Modal, Keyboard, KeyboardAvoidingView, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse, faPlus} from '@fortawesome/free-solid-svg-icons';
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

interface Task {
    docId: string;
    taskId: string;
    name: string;
    description: string;
    cost: number;
    childIds: string[];
    duration: number;
    timerType: 'countdown' | 'countup';
    parentUuid: string;
}

const TaskScreen = () => {
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskCost, setTaskCost] = useState('');
    const [taskDuration, setTaskDuration] = useState('');
    const [timerType, setTimerType] = useState<'countdown' | 'countup'>('countup');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [kids, setKids] = useState<Kid[]>([]);
    const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchTasks();
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

    const addTaskToFirestore = async () => {
        try {
            const taskId = uuid.v4() as string;// Generate unique ID
            const auth = getAuth();
            const newTask: Omit<Task, 'docId'> = {
                taskId,
                name: taskName,
                description: taskDescription,
                cost: parseFloat(taskCost) || 0,
                childIds: selectedChildIds,
                duration: timerType === 'countdown' ? parseFloat(taskDuration) || 0 : 0,
                timerType,
                parentUuid: auth.currentUser?.uid || ''
            };
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Tasks'), newTask);
            setTasks((prevTasks) => [...prevTasks, { ...newTask, docId: docRef.id }]);
            setTaskName('');
            setTaskDescription('');
            setTaskCost('');
            setTaskDuration('');
            setTimerType('countup');
            setSelectedChildIds([]);
            setCreateTaskModalVisible(false);   
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const fetchTasks = async () => {
        try {
            const auth = getAuth();
            const parentUuid = auth.currentUser?.uid || '';
            const q = query(
                collection(FIRESTORE_DB, 'Tasks'),
                where('parentUuid', '==', parentUuid)
            );
            const querySnapshot = await getDocs(q);
            const fetchedTasks: Task[] = querySnapshot.docs.map((doc) => ({
                docId: doc.id,
                taskId: doc.data().taskId,
                childIds: doc.data().childIds || [],
                ...doc.data(),
                duration: doc.data().duration || 0,
                timerType: (doc.data().timerType as 'countdown' | 'countup') || 'countup'
            } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const updateTask = async (task: Task) => {
        try {
            const taskRef = doc(FIRESTORE_DB, 'Tasks', task.docId);
            const updatedDurationValue = task.timerType === 'countdown' ? task.duration : 0;
            await updateDoc(taskRef, {
                name: task.name,
                description: task.description,
                cost: task.cost,
                childIds: task.childIds,
                duration: updatedDurationValue,
                timerType: task.timerType
            });
            setTasks((prevTasks) => prevTasks.map((t) => 
                t.taskId === task.taskId ? { ...task } : t
            ));
            setModalVisible(false);
            setSelectedTask(null);
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    const deleteTask = async (task: Task) => {
        try {
            const taskRef = doc(FIRESTORE_DB, 'Tasks', task.docId);
            await deleteDoc(taskRef);

            const completionsRef = collection(FIRESTORE_DB, 'TaskCompletions');
            const completionQuery = query(completionsRef, where('taskId', '==', task.taskId));
            const completionSnapshot = await getDocs(completionQuery);

            // Update respective tasks completions with taskRemoved: true
            const updatePromises = completionSnapshot.docs.map(async (completionDoc) => {
                const completionRef = doc(FIRESTORE_DB, 'TaskCompletions', completionDoc.id);
                await updateDoc(completionRef, { taskRemoved: true });
            });
            await Promise.all(updatePromises);

            setTasks((prevTasks) => prevTasks.filter((prevTask) => prevTask.docId !== task.docId));
            setModalVisible(false);
            setSelectedTask(null);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const renderTask = ({ item }: { item: Task }) => {
        const renderRightActions = () => (
            <Pressable style={styles.deleteButton} onPress={() => deleteTask(item)}>
                <FontAwesome name="trash" size={20} color="white" />
                <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
        );
    
        return (
            <Swipeable renderRightActions={renderRightActions}>
                <Pressable style={styles.taskItem} onPress={() => openTaskModal(item)}>
                    <View style={styles.taskContent}>
                        <Text style={styles.taskName}>{item.name}</Text>
                        <View style={styles.kidBubblesContainer}>
                            {item.childIds.length > 0 ? (
                                item.childIds.map((id) => {
                                    const kid = kids.find(k => k.kidId === id);
                                    return (
                                        <View key={id} style={styles.kidBubble}>
                                            <Text style={styles.kidBubbleText}>
                                                {kid?.name || id}
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

    const openTaskModal = (task: Task) => {
        setSelectedTask({ ...task });
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedTask) {
            updateTask(selectedTask);
        }
    };

    const handleDelete = () => {
        if (selectedTask) {
            deleteTask(selectedTask);
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

                <Text style={styles.title}>Manage Tasks</Text>
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.taskId || item.docId}
                    renderItem={renderTask}
                />
                
                {/* Edit Task Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.overlay}>
                        <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
                            <ScrollView contentContainerStyle={styles.modalScrollContent}>
                                <View style={styles.modalView}>
                                    <Pressable onPress={() => setModalVisible(false)} style={styles.closeXButton}>
                                        <FontAwesome name="close" size={24} color="black" />
                                    </Pressable>
                                    <Text style={styles.modalTitle}>Edit Task</Text>
                                    <Text style={styles.modalSubTitle}>Name:</Text>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="Edit task name"
                                        placeholderTextColor="#333"
                                        value={selectedTask ? selectedTask.name : ''}
                                        onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, name: text }) as Task | null)}
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                    <Text style={styles.modalSubTitle}>Description:</Text>
                                    <TextInput 
                                        style={styles.input}
                                        value={selectedTask ? selectedTask.description : ''}
                                        onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, description: text }) as Task | null)}
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                    <Text style={styles.modalSubTitle}>Coins:</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        placeholder="Enter task cost"
                                        placeholderTextColor="#333" 
                                        keyboardType="numeric" 
                                        value={selectedTask ? String(selectedTask.cost) : ''} 
                                        onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, cost: parseInt(text.replace(/[^0-9]/g, ''), 10) }) as Task | null)}
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                    <Text style={styles.modalSubTitle}>Timer Type:</Text>
                                    <View style={styles.radioContainer}>
                                        <Pressable
                                            style={styles.radioOption}
                                            onPress={() => setSelectedTask((prev) => prev ? { ...prev, timerType: 'countdown' } : null)}
                                        >
                                            <View style={[styles.radioCircle, selectedTask?.timerType === 'countdown' && styles.radioSelected]} />
                                            <Text style={styles.radioText}>Countdown</Text>
                                        </Pressable>
                                        <Pressable
                                            style={styles.radioOption}
                                            onPress={() => setSelectedTask((prev) => prev ? { ...prev, timerType: 'countup' } : null)}
                                        >
                                            <View style={[styles.radioCircle, selectedTask?.timerType === 'countup' && styles.radioSelected]} />
                                            <Text style={styles.radioText}>Count-up</Text>
                                        </Pressable>
                                    </View>
                                    {selectedTask?.timerType === 'countdown' && (
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.modalSubTitle}>Duration (minutes):</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Duration (minutes)"
                                                placeholderTextColor="#333"
                                                keyboardType="numeric"
                                                value={selectedTask ? String(selectedTask.duration) : ''}
                                                onChangeText={(text) => setSelectedTask((prev) => prev ? { ...prev, duration: parseInt(text.replace(/[^0-9]/g, ''), 10) || 0 } : null)}
                                                returnKeyType="done"
                                                onSubmitEditing={() => Keyboard.dismiss()}
                                            />
                                        </View>
                                    )}

                                    <Text style={styles.modalSubTitle}>Assign to Kids:</Text>
                                    {kids.map((kid) => (
                                        <View key={kid.kidId} style={styles.checkboxContainer}>
                                            <Pressable
                                                onPress={() => {
                                                    const updatedChildIds = selectedTask?.childIds.includes(kid.kidId)
                                                        ? selectedTask.childIds.filter((id) => id !== kid.kidId)
                                                        : [...(selectedTask?.childIds || []), kid.kidId];
                                                    setSelectedTask((prev) => prev ? { ...prev, childIds: updatedChildIds } : null);
                                                }}
                                                style={styles.checkbox}
                                            >
                                                <Text>{selectedTask?.childIds.includes(kid.kidId) ? '✓' : ' '}</Text>
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
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                {/* Add Task Button */}
                <Pressable style={styles.plusButtonStyle} onPress={() => setCreateTaskModalVisible(true)}>
                    <FontAwesome name="plus" size={12} color="black" />
                </Pressable>

                {/* Create Task Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={createTaskModalVisible}
                    onRequestClose={() => setCreateTaskModalVisible(false)}
                >
                    <View style={styles.overlay}>
                        <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
                            <ScrollView contentContainerStyle={styles.modalScrollContent}>
                                <View style={styles.modalView}>
                                    <Pressable onPress={() => setCreateTaskModalVisible(false)} style={styles.closeXButton}>
                                        <FontAwesome name="close" size={24} color="black" />
                                    </Pressable>
                                    <Text style={styles.modalTitle}>Create Task</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Task Name"
                                        placeholderTextColor="#333"
                                        value={taskName}
                                        onChangeText={setTaskName}
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Description"
                                        placeholderTextColor="#333"
                                        value={taskDescription}
                                        onChangeText={setTaskDescription}
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="# of Coins"
                                        placeholderTextColor="#333"
                                        keyboardType="numeric"
                                        value={taskCost}
                                        onChangeText={setTaskCost}
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                    <Text style={styles.modalSubTitle}>Timer Type:</Text>
                                    <View style={styles.radioContainer}>
                                        <Pressable
                                            style={styles.radioOption}
                                            onPress={() => setTimerType('countdown')}
                                        >
                                            <View style={[styles.radioCircle, timerType === 'countdown' && styles.radioSelected]} />
                                            <Text style={styles.radioText}>Countdown</Text>
                                        </Pressable>
                                        <Pressable
                                            style={styles.radioOption}
                                            onPress={() => setTimerType('countup')}
                                        >
                                            <View style={[styles.radioCircle, timerType === 'countup' && styles.radioSelected]} />
                                            <Text style={styles.radioText}>Count-up</Text>
                                        </Pressable>
                                    </View>
                                    {timerType === 'countdown' && (
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Duration (minutes)"
                                            placeholderTextColor="#333"
                                            keyboardType="numeric"
                                            value={taskDuration}
                                            onChangeText={setTaskDuration}
                                            returnKeyType="done"
                                            onSubmitEditing={() => Keyboard.dismiss()}
                                        />
                                    )}

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

                                    <Pressable style={styles.plusButtonStyle} onPress={addTaskToFirestore}>
                                        <FontAwesome name="plus" size={12} color="black" />
                                    </Pressable>
                                    <Pressable style={styles.buttonClose} onPress={() => setCreateTaskModalVisible(false)}>
                                        <Text>Close</Text>
                                    </Pressable>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
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
    taskItem: {
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
    taskName: {
        fontSize: 16,
        marginRight: 10,
    },
    taskContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
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
    kidBubbleText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    noneBubble: {
        backgroundColor: '#CCCCCC',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for better contrast
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '100%',
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
    inputContainer: {
        width: '100%',
        alignItems: 'center',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
    },
    radioContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 10,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioCircle: {
        width: 30,
        height: 30,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#A8D5BA',
        marginRight: 8,
    },
    radioSelected: {
        backgroundColor: '#A8D5BA',
    },
    radioText: {
        fontSize: 16,
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
        height: '100%', // This covers full height, making borderRadius less visible
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

export default TaskScreen;
