// TaskScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Pressable, Modal, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FontAwesome } from '@expo/vector-icons';
import { faTasks, faChild, faGift, faHouse, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Link, useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import uuid from 'react-native-uuid';

const TaskScreen = ({ navigation }) => {
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskCost, setTaskCost] = useState('');
    const [tasks, setTasks] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const router = useRouter();

    const addTaskToFirestore = async () => {
        try {
            const taskId = uuid.v4() // Generate unique ID
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Tasks'), {
                id: taskId,
                name: taskName,
                description: taskDescription,
                cost: parseFloat(taskCost),
                completed: false
            });
            console.log("Document written with ID: ", docRef.id);
            setTasks((prevTasks) => [
                ...prevTasks,
                { id: docRef.id, name: taskName, description: taskDescription, cost: parseFloat(taskCost), completed: false }
            ]);
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
            const fetchedTasks = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description,
                cost: doc.data().cost,
                completed: doc.data().completed
            }));
            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const updateTask = async (taskId, updatedName, updatedDescription, updatedCost) => {
        try {
            const taskRef = doc(FIRESTORE_DB, 'Tasks', taskId);
            await updateDoc(taskRef, { name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) });
            setTasks((prevTasks) => prevTasks.map((task) => 
                task.id === taskId ? { ...task, name: updatedName, description: updatedDescription, cost: parseFloat(updatedCost) } : task
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

    const deleteTask = async (taskId) => {
        try {
            const taskRef = doc(FIRESTORE_DB, 'Tasks', taskId);
            await deleteDoc(taskRef);
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
            setModalVisible(false);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const renderTask = ({ item }) => (
        <Pressable style={styles.taskItem} onPress={() => openTaskModal(item)}>
            <Text>{item.name}</Text>
        </Pressable>
    );

    const openTaskModal = (task) => {
        setSelectedTask(task);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (selectedTask) {
            updateTask(selectedTask.id, selectedTask.name, selectedTask.description, selectedTask.cost);
        }
    };

    const handleDelete = () => {
        if (selectedTask) {
            deleteTask(selectedTask.id);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
            
            {/* Header with settings and navigation to kids view */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push('/screens/dashboardScreens')} style={styles.headerButton} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
                    <FontAwesomeIcon icon={faHouse} size={24} color="black" />
                </Pressable>
            </View>

            <Text style={styles.title}>Manage Tasks</Text>
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
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
                        <TextInput style={styles.input} placeholder="Edit task name" placeholderTextColor="#333" value={selectedTask ? selectedTask.name : ''} onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, name: text }))}/>
                        <Text>Task Description:</Text>
                        <TextInput style={styles.input} value={selectedTask ? selectedTask.description : ''} onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, description: text }))} />

                        <Text>Task Cost:</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={selectedTask ? String(selectedTask.cost) : ''} onChangeText={(text) => setSelectedTask((prev) => ({ ...prev, cost: parseFloat(text) }))} />

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
        backgroundColor: '#A8D5BA',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        alignSelf: 'center',
        paddingTop: 10
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
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        backgroundColor: '#A8D5BA',
        padding: 16
    },
    buttonContainer: {
        marginVertical: 10,
        borderRadius: 10,
        backgroundColor: '#A8D5BA',
        borderColor: '#fff',
        borderWidth: 3,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '10%',
        alignSelf: 'center'
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
    }
});

export default TaskScreen;