// TaskScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTasks, faChild, faGift, faHouse } from '@fortawesome/free-solid-svg-icons';
import { Link, useRouter } from 'expo-router';
import { FIREBASE_DB as FIRESTORE_DB} from '../../../FirebaseConfig';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import uuid from 'react-native-uuid';

const TaskScreen = ({ navigation }) => {
    const [taskName, setTaskName] = useState('');
    const [tasks, setTasks] = useState([]);
    const router = useRouter();

    const addTask = () => {
        if (taskName) {
            const newTask = { id: uuid.v4(), name: taskName, completed: false };
            setTasks((prevTasks) => [...prevTasks, newTask]);
            setTaskName(''); 
        }
    };

    const renderTask = ({ item }) => (
        <View style={styles.taskItem}>
            <Text>{item.name}</Text>
        </View>
    );

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Tasks'));
                const fetchedTasks = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    name: doc.data().name,
                    completed: doc.data().completed
                }));
                setTasks(fetchedTasks);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        };
        fetchTasks();
    }, []);

    const addTaskToFirestore = async () => {
        try {
            const taskId = uuid.v4() // Generate unique ID
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Tasks'), {
                id: taskId,
                name: taskName,
                completed: false
            });
            console.log("Document written with ID: ", docRef.id);
            setTasks((prevTasks) => [...prevTasks, { id: taskId, name: taskName }]);
            setTaskName('');
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header with settings and navigation to kids view */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/screens/dashboardScreens')} style={styles.headerButton}>
                    <FontAwesomeIcon icon={faHouse} size={24} color="black" />
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>Manage Tasks</Text>
            {/* <Button title="Add Task" onPress={addTask} /> */}
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
            />

            <TextInput
                style={styles.input}
                placeholder="Enter task name"
                value={taskName}
                onChangeText={setTaskName}
            />
            <TouchableOpacity style={styles.buttonContainer} onPress={addTaskToFirestore}>
                <Text>+</Text>
            </TouchableOpacity>
            

            {/* Bottom navigation with icons */}
            <View style={styles.bottomNavigation}>
                <Link href="/screens/dashboardScreens/TasksManagementScreen"><FontAwesomeIcon icon={faTasks} size={24} color="black" /></Link>
                <Link href="/screens/dashboardScreens/KidsManagementScreen"><FontAwesomeIcon icon={faChild} size={24} color="black" /></Link>
                <Link href="/screens/dashboardScreens/RewardsManagementScreen"><FontAwesomeIcon icon={faGift} size={24} color="black" /></Link>
            </View>
        </View>
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
    }
});

export default TaskScreen;