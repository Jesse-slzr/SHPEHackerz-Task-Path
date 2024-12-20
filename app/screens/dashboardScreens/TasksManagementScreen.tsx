// TaskScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet, Pressable, Modal, KeyboardAvoidingView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';

interface Task {
    docId: string;
    taskId: string;
    name: string;
    description: string;
    cost: number;
    completed: boolean;
    childId: string;
}

const TaskScreen = () => {
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskCost, setTaskCost] = useState('');
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
                childId: ""
            };
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Tasks'), newTask);
            setTasks((prevTasks) => [...prevTasks, { ...newTask, docId: docRef.id }]);
            setTaskName('');
            setTaskDescription('');
            setTaskCost('');
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
                docId: doc.id
            } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const updateTask = async (task: Task,taskId: string, updatedName: string, updatedDescription: string, updatedCost: string) => {
        try {
            const taskRef = doc(FIRESTORE_DB, 'Tasks', task.docId);
            await updateDoc(taskRef, { name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) });
            setTasks((prevTasks) => prevTasks.map((task) => 
                task.taskId === taskId ? { ...task, name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) } : task
            ));
            setModalVisible(false);
            setSelectedTask(null);
            setTaskName('');
            setTaskDescription('');
            setTaskCost('');
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

    const renderTask = ({ item }: { item: Task}) => (
        <Pressable style={styles.taskItem} onPress={() => openTaskModal(item)}>
            <Text>{item.name}</Text>
        </Pressable>
    );

    const openTaskModal = (task: Task) => {
        setSelectedTask(task);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedTask) {
            updateTask(selectedTask,selectedTask.taskId, selectedTask.name, selectedTask.description, selectedTask.cost.toString());
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
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={{ marginBottom: 5, textAlign: 'center' }}>Task Name:</Text>
                        <TextInput style={styles.input} placeholder="Edit task name" placeholderTextColor="#333" value={selectedTask ? selectedTask.name : ''} onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, name: text }) as Task | null)}/>
                        <Text>Task Description:</Text>
                        <TextInput style={styles.input} value={selectedTask ? selectedTask.description : ''} onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, description: text }) as Task | null)} />

                        <Text>Task Cost:</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter task cost" // Add placeholder
                            placeholderTextColor="#333" 
                            keyboardType="numeric" 
                            value={selectedTask ? String(selectedTask.cost) : ''} 
                            onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, cost: parseInt(text.replace(/[^0-9]/g, ''), 10) }) as Task | null)}
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

            <Pressable style={styles.plusButtonStyle} onPress={() => setCreateTaskModalVisible(true)}>
                <FontAwesome name="plus" size={12} color="black" />
            </Pressable>

            {/* Create Task Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createTaskModalVisible}
                onRequestClose={() => setCreateTaskModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={{ marginVertical: 5, textAlign: 'center', fontWeight: 'bold' }}>Create Task</Text>
                        <TextInput style={styles.input} placeholder="Task Name" placeholderTextColor="#333" value={taskName} onChangeText={setTaskName} />
                        <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#333" value={taskDescription} onChangeText={setTaskDescription} />
                        <TextInput style={styles.input} placeholder="Cost" placeholderTextColor="#333" keyboardType="numeric" value={taskCost} onChangeText={setTaskCost} />
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
        fontSize: 24,
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
    input: {
        marginTop: 10,
        borderWidth: 1,
        width: '50%',
        alignSelf: 'center',
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginBottom: 20
    },
    buttonSave: {
        backgroundColor: '#2196F3' 
    },
    buttonDelete: {
        backgroundColor: '#FF3E3E'
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

export default TaskScreen;