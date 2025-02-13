// TaskScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet, Pressable, Modal, KeyboardAvoidingView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse, faPlus} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';
import {Swipeable, GestureHandlerRootView,} from 'react-native-gesture-handler';

interface Task {
    docId: string;
    taskId: string;
    name: string;
    description: string;
    cost: number;
    completed: boolean;
    childId: string;
    duration: number;
}

const TaskScreen = () => {
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskCost, setTaskCost] = useState('');
    const [taskDuration, setTaskDuration] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const addTaskToFirestore = async () => {
        try {
            const taskId = uuid.v4() // Generate unique ID
            const newTask = {
                taskId: taskId,
                name: taskName,
                description: taskDescription,
                cost: parseFloat(taskCost),
                completed: false,
                childId: "",
                duration: parseFloat(taskDuration),
            };
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Tasks'), newTask);
            setTasks((prevTasks) => [...prevTasks, { ...newTask, docId: docRef.id }]);
            setTaskName('');
            setTaskDescription('');
            setTaskCost('');
            setTaskDuration('');
            setCreateTaskModalVisible(false);   
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const fetchTasks = async () => {
        try {
            const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Tasks'));
            const fetchedTasks: Task[] = querySnapshot.docs.map((doc) => ({
                taskId: doc.data().taskId,
                ...doc.data(),
                duration: doc.data().duration || 0,
                docId: doc.id
            } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const updateTask = async (task: Task,taskId: string, updatedName: string, updatedDescription: string, updatedCost: string, updatedDuration: string) => {
        try {
            const taskRef = doc(FIRESTORE_DB, 'Tasks', task.docId);
            await updateDoc(taskRef, { name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost), duration: parseFloat(updatedDuration) });
            setTasks((prevTasks) => prevTasks.map((task) => 
                task.taskId === taskId ? { ...task, name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost), duration: parseFloat(updatedDuration) } : task
            ));
            setModalVisible(false);
            setSelectedTask(null);
            setTaskName('');
            setTaskDescription('');
            setTaskCost('');
            setTaskDuration('');
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    const deleteTask = async (task: Task) => {
        try {
            const taskRef = doc(FIRESTORE_DB, 'Tasks', task.docId);
            await deleteDoc(taskRef);
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
                    <Text style={styles.taskName}>{item.name}</Text>
                </Pressable>
            </Swipeable>
        );
    };

    const openTaskModal = (task: Task) => {
        setSelectedTask(task);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedTask) {
            updateTask(selectedTask,selectedTask.taskId, selectedTask.name, selectedTask.description, selectedTask.cost.toString(), selectedTask.duration.toString());
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
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading Tasks...</Text>
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
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.overlay}>
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
                        />
                        <Text style={styles.modalSubTitle}>Description:</Text>
                        <TextInput 
                            style={styles.input}
                            value={selectedTask ? selectedTask.description : ''}
                            onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, description: text }) as Task | null)}
                        />
                        <Text style={styles.modalSubTitle}>Coins:</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter task cost"
                            placeholderTextColor="#333" 
                            keyboardType="numeric" 
                            value={selectedTask ? String(selectedTask.cost) : ''} 
                            onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, cost: parseInt(text.replace(/[^0-9]/g, ''), 10) }) as Task | null)}
                        />
                        <Text style={styles.modalSubTitle}>Duration (Min):</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Duration (minutes)"
                            placeholderTextColor="#333"
                            keyboardType="numeric"
                            value={selectedTask ? String(selectedTask.duration) : ''} 
                            onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, duration: parseInt(text.replace(/[^0-9]/g, ''), 10) }) as Task | null)}
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
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Description"
                            placeholderTextColor="#333"
                            value={taskDescription}
                            onChangeText={setTaskDescription}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="# of Coins"
                            placeholderTextColor="#333"
                            keyboardType="numeric"
                            value={taskCost}
                            onChangeText={setTaskCost}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Duration"
                            placeholderTextColor="#333"
                            keyboardType="numeric"
                            value={taskDuration}
                            onChangeText={setTaskDuration}
                        />
                        <Pressable style={styles.plusButtonStyle} onPress={addTaskToFirestore}>
                            <FontAwesome name="plus" size={12} color="black" />
                        </Pressable>
                        <Pressable style={styles.buttonClose} onPress={() => setCreateTaskModalVisible(false)}>
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
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for better contrast
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
});

export default TaskScreen;
