// KidsManagementScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTasks, faChild, faGift, faHouse } from '@fortawesome/free-solid-svg-icons';
import { Link, useRouter } from 'expo-router';

const KidsManagementScreen = ({ navigation }) => {
    const [kidName, setKidName] = useState('');
    const [kids, setKids] = useState([]);
    const router = useRouter();
    const [editingKid, setEditingKid] = useState(null); // New code
    const [kidAge, setKidAge] = useState(''); // New code
    const [isEditModalVisible, setEditModalVisible] = useState(false); // New code
    const [isAddModalVisible, setAddModalVisible] = useState(false); // New code

    const openAddKidModal = () => {
        setKidName('');
        setKidAge('');
        setAddModalVisible(true);
    };

    const addKid = () => {
        if (kidName.trim() && kidAge.trim()) { // Modified to include kidAge
            setKids([...kids, { id: Date.now().toString(), name: kidName, age: kidAge }]); // Modified to include age
            setKidName('');
            setKidAge(''); // Reset kidAge
            setAddModalVisible(false); // Close Add Kid modal
        }
    };



    const updateKid = () => {
        if (kidName.trim() && kidAge.trim() && editingKid) { // Modified to include kidAge
            setKids(kids.map(kid => kid.id === editingKid.id ? { ...kid, name: kidName, age: kidAge } : kid));
            setKidName('');
            setKidAge(''); // Reset kidAge
            setEditingKid(null);
            setEditModalVisible(false); // Close Edit Kid modal
        }
    };

    const cancelEdit = () => { // New function to cancel editing
        setKidName('');
        setKidAge('');
        setEditingKid(null);
        setEditModalVisible(false);
    };

    const deleteKid = (id) => {
        setKids(kids.filter(kid => kid.id !== id));
    };

    const startEditing = (kid) => {
        setKidName(kid.name);
        setKidAge(kid.age); // Set kidAge for editing
        setEditingKid(kid);
        setEditModalVisible(true); // New code to open Edit Kid modal
    };

    const renderKid = ({ item }) => (
        <View style={styles.kidItem}>
            <Text style={styles.kidName}>{item.name} (Age: {item.age})</Text> {/* Modified to display age */}
            <View style={styles.kidItemButtons}> {/* New View to fix button positions */}
                <TouchableOpacity onPress={() => startEditing(item)} style={styles.editButton}>
                    <Text>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteKid(item.id)} style={styles.deleteButton}>
                    <Text>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header with settings and navigation to kids view */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/screens/dashboardScreens')} style={styles.headerButton}>
                    <FontAwesomeIcon icon={faHouse} size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>Manage Kids</Text>
            </View>

            {/* Button to open Add Kid modal */}
            <Button
                title="Add Kid" // Modified to always show "Add Kid"
                onPress={openAddKidModal} // New onPress handler
            />

            {/* Kids List */}
            <FlatList
                data={kids}
                keyExtractor={(item) => item.id}
                renderItem={renderKid}
            />

            {/* Add Kid Modal */}
            <Modal
                visible={isAddModalVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalContainer}> {/* New Modal for adding a kid */}
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Kid</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter kid's name"
                            value={kidName}
                            onChangeText={setKidName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter kid's age"
                            value={kidAge}
                            onChangeText={setKidAge}
                            keyboardType="numeric" // Numeric keyboard for age
                        />
                        <Button title="Add" onPress={addKid} />
                        <Button title="Cancel" onPress={() => setAddModalVisible(false)} />
                    </View>
                </View>
            </Modal>

            {/* Edit Kid Modal */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalContainer}> {/* New Modal for editing a kid */}
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Kid</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter kid's name"
                            value={kidName}
                            onChangeText={setKidName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter kid's age"
                            value={kidAge}
                            onChangeText={setKidAge}
                            keyboardType="numeric"
                        />
                        <Button title="Update" onPress={updateKid} />
                        <Button title="Cancel" onPress={cancelEdit} />
                    </View>
                </View>
            </Modal>

            {/* Bottom navigation with icons */}
            <View style={styles.bottomNavigation}>
                <Link href="/screens/dashboardScreens/TasksManagementScreen">
                    <FontAwesomeIcon icon={faTasks} size={24} color="black" />
                </Link>
                <Link href="/screens/dashboardScreens/KidsManagementScreen">
                    <FontAwesomeIcon icon={faChild} size={24} color="black" />
                </Link>
                <Link href="/screens/dashboardScreens/RewardsManagementScreen">
                    <FontAwesomeIcon icon={faGift} size={24} color="black" />
                </Link>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        padding: 16,
        backgroundColor: '#A8D5BA',
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: { marginRight: 16 },
    title: { fontSize: 24, fontWeight: 'bold' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, width: '80%' },
    kidItem: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Modified to space between
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    kidName: { flex: 1 }, // Ensure the name takes up available space
    kidItemButtons: { flexDirection: 'row' }, // New style for buttons container
    editButton: { marginRight: 10 }, // Style for edit button
    deleteButton: {}, // Style for delete button
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#A8D5BA',
        padding: 16,
    },
    modalContainer: { // New styles for modal background
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    },
    modalContent: { // New styles for modal content
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
});

export default KidsManagementScreen;