// TaskScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faTasks, faChild, faGift } from '@fortawesome/free-solid-svg-icons';

const TaskScreen = ({ navigation }) => {
    const [taskName, setTaskName] = useState('');
    const [tasks, setTasks] = useState([]);

    const addTask = () => {
        if (taskName) {
            setTasks([...tasks, { id: Math.random().toString(), name: taskName }]);
            setTaskName(''); // Clear the input field
        }
    };

    const renderTask = ({ item }) => (
        <View style={styles.taskItem}>
            <Text>{item.name}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header with settings and navigation to kids view */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton}>
                <FontAwesomeIcon icon={faBars} size={24} color="black" />
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>Manage Tasks</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter task name"
                value={taskName}
                onChangeText={setTaskName}
            />
            <Button title="Add Task" onPress={addTask} />
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
            />

            {/* Bottom navigation with icons */}
            <View style={styles.bottomNavigation}>
                <TouchableOpacity><FontAwesomeIcon icon={faTasks} size={24} color="black" /></TouchableOpacity>
                <TouchableOpacity><FontAwesomeIcon icon={faChild} size={24} color="black" /></TouchableOpacity>
                <TouchableOpacity><FontAwesomeIcon icon={faGift} size={24} color="black" /></TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 16, backgroundColor: '#A8D5BA', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 },
    taskItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
    bottomNavigation: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, backgroundColor: '#A8D5BA', padding: 16 },
});

export default TaskScreen;