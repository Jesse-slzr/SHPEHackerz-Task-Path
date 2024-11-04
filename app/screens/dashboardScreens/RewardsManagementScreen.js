// RewardManagementScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTasks, faChild, faGift, faHouse } from '@fortawesome/free-solid-svg-icons';
import { Link, useRouter } from 'expo-router';

const RewardManagementScreen = ({ navigation }) => {
    const [rewardName, setRewardName] = useState('');
    const [rewards, setRewards] = useState([]);
    const router = useRouter();

    const addReward = () => {
        if (rewardName) {
            setRewards([...rewards, { id: Math.random().toString(), name: rewardName }]);
            setRewardName(''); // Clear the input field
        }
    };

    const renderReward = ({ item }) => (
        <View style={styles.rewardItem}>
            <Text>{item.name}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header with settings and navigation to kids view */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/screens/dashboardScreens')} style={styles.headerButton}>
                    <FontAwesomeIcon icon={faHouse} size={24} color="black" />
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>Manage Rewards</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter reward name"
                value={rewardName}
                onChangeText={setRewardName}
            />
            <Button title="Add Reward" onPress={addReward} />
            <FlatList
                data={rewards}
                keyExtractor={(item) => item.id}
                renderItem={renderReward}
            />

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
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 16, backgroundColor: '#A8D5BA', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 },
    rewardItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
    bottomNavigation: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, backgroundColor: '#A8D5BA', padding: 16 },
});

export default RewardManagementScreen;