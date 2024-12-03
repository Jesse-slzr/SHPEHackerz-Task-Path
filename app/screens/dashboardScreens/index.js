import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGear, faTasks, faChild, faGift } from '@fortawesome/free-solid-svg-icons'; // Import specific icons
import { BarChart } from 'react-native-chart-kit'; // Import BarChart
import { Link, useRouter } from 'expo-router';

const DashboardScreen = () => {
    const router = useRouter();
    const [selectedKid, setSelectedKid] = useState('1');
    const [selectedWeek, setSelectedWeek] = useState('This Week');
    
    // Generate available week options based on recentTasks
    const getAvailableWeeks = () => {
        const weeks = [];
        recentTasks.forEach((task) => {
            const taskDate = new Date(task.date);
            const startOfWeek = getStartOfWeek(taskDate);
            const endOfWeek = getEndOfWeek(startOfWeek);
            const label = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
            if (!weeks.find(w => w.label === label)) {
                weeks.push({ label, startOfWeek, endOfWeek });
            }
        });
        return weeks;
    };

    const [recentTasks, setRecentTasks] = useState([
        { id: '1', date: '2024-10-29', taskName: 'Task 1', taskStatus: 'Completed', rewardAMT: '5', childID: '1' },
        { id: '2', date: '2024-10-28', taskName: 'Task 2', taskStatus: 'Completed', rewardAMT: '5', childID: '1' },
        { id: '3', date: '2024-10-31', taskName: 'Task 3', taskStatus: 'In Progress', rewardAMT: '5', childID: '2' },
        { id: '4', date: '2024-10-29', taskName: 'Task 4', taskStatus: 'Completed', rewardAMT: '10', childID: '2' },
        { id: '5', date: '2024-10-30', taskName: 'Task 5', taskStatus: 'Completed', rewardAMT: '10', childID: '1' },
    ]);

    // Get completed tasks sorted by date in descending order
    const getSortedCompletedTasks = () => {
        return recentTasks
            .filter(task => task.taskStatus === 'Completed')
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort tasks by date (most recent first)
    };

    // Get task data for week
    const getTaskDataForWeek = () => {
        const taskCountPerDay = Array(7).fill(0);
        const filteredTasks = getSortedCompletedTasks().filter(task => task.childID === selectedKid);
        const startDate = new Date('2024-10-28');
        const endDate = new Date('2024-11-1');

        filteredTasks.forEach(task => {
            const taskDate = new Date(task.date);
            if (taskDate >= startDate && taskDate <= endDate) {
                taskCountPerDay[taskDate.getDay()] += 1;
            }
        });
        return taskCountPerDay;
    };

    const taskDataForWeek = getTaskDataForWeek();

    // Render each task in the recent tasks list
    const renderTask = ({ item }) => (
        <View style={styles.taskBubble}>
            <View style={styles.taskDate}>
                <Text>{item.date}</Text>
            </View>
            <View style={styles.taskKidInfo}>
                <Text style={styles.kidInfoText}>Completed by Kid {item.childID}</Text>
            </View>
            <View style={styles.taskName}>
                <Text style={styles.taskNameText}>{item.taskName}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header with settings and navigation to kids view */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(auth)/SignOut')} style={styles.headerButton}>
                    <FontAwesomeIcon icon={faGear} size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.kidsViewButton} onPress={() => router.push('/screens/kidsViewScreens')}>
                    <Text style={styles.kidsViewButtonText}>Enter Kids View</Text>
                </TouchableOpacity>
            </View>
            
            {/* Main title of the dashboard */}
            <View>
                <Text style={styles.title}>Dashboard</Text>
            </View>

            {/* Tabs to switch between kids */}
            <View style={styles.kidTabs}>
                <TouchableOpacity 
                style={[styles.tabButton, selectedKid === '1' && styles.selectedTab]}
                onPress={() => setSelectedKid('1')}
                >
                <Text>Kid 1</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                style={[styles.tabButton, selectedKid === '2' && styles.selectedTab]}
                onPress={() => setSelectedKid('2')}
                >
                <Text>Kid 2</Text>
                </TouchableOpacity>
            </View>

            {/* Section displaying tasks completed this week */}
            <View style={styles.graphSection}>
                <View style={styles.taskSummary}>
                    <Text style={styles.taskSummaryCount}>{taskDataForWeek.reduce((sum, val) => sum + val, 0)} Tasks</Text>
                    <Text style={styles.taskSummaryText}>This week</Text>
                </View>
                <BarChart
                data={{
                    labels: ['M', 'T', 'W', 'TH', 'F', 'S', 'S'],
                    datasets: [{ data: taskDataForWeek }]
                }}
                width={Dimensions.get('window').width - 30}
                height={170}
                fromNumber={Math.max(...taskDataForWeek) > 4 ? Math.max(...taskDataForWeek) : 4 }
                yAxisLabel=""
                chartConfig={{
                    backgroundColor: '#FFF',
                    backgroundGradientFrom: '#FFF',
                    backgroundGradientTo: '#FFF',
                    decimalPlaces: 0,
                    color: (opacity = 0) => `rgba(0,0,0, ${opacity})`,
                    labelColor: (opacity = 0) => `rgba(0, 0, 0, ${opacity})`,
                }}
                style={styles.chart}
                />
                <TouchableOpacity style={styles.reportButton}>
                <Text style={styles.reportButtonText}>Generate Report</Text>
                </TouchableOpacity>
            </View>
            
            {/* Recent tasks section */}
            <Text style={styles.recentTasks}>Recent Tasks</Text>
            <FlatList
                data={getSortedCompletedTasks()}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
                ListEmptyComponent={<Text>No recent tasks.</Text>}
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

// Helper functions to get the start and end of the week for a given date
const getStartOfWeek = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
};

const getEndOfWeek = (startOfWeek) => {
    return new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
};

// Format date as MM/DD for display
const formatDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
};

// Styles for the component
const styles = {
    container: {
        flex: 1,
        backgroundColor: '#FFF'
    },
    header: {
        padding: 16,
        backgroundColor: '#A8D5BA',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' },
    headerButton: {
        padding: 10
    },
    kidsViewButton: {
        alignSelf: 'flex-end',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 20,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
    },
    kidsViewButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    title: { 
        fontSize: 30,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        paddingTop: 16
    },
    kidTabs: {
        flexDirection: 'row',
        marginTop: 16,
        paddingHorizontal: 16
    },
    tabButton: { 
        padding: 10 
    },
    selectedTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#000'
    },
    graphSection: {
        marginBottom: 5,
        paddingHorizontal: 16
    },
    taskSummary: {
        margin: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'baseline'
    },
    taskSummaryCount: {
        fontSize: 24,
        lineHeight: 24,
        fontWeight: 'bold'
    },
    taskSummaryText: {
        fontSize: 20,
        lineHeight: 20
    },
    chart: {
        borderRadius: 10,
        marginVertical: 8,
        alignSelf: 'center'
    },
    reportButton: {
        marginTop: 10,
        padding: 5,
        backgroundColor:
        '#A8D5BA',
        borderRadius: 15,
        width: '35%',
        alignSelf: 'center'
    },
    reportButtonText: {
        color: '#000',
        textAlign: 'center',
    },
    recentTasks: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        paddingHorizontal: 16,
    },
    taskBubble: {
        padding: 12,
        backgroundColor: '#E8F5E9',
        borderRadius: 40,
        borderColor: '#000',
        borderWidth: 1,
        marginBottom: 10,
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        width: '75%',
        alignSelf: 'center',
    },
    taskDate: {
        width: '45%',
        marginBottom: 10,
    },
    taskKidInfo: {
        width: '50%',
        marginBottom: 10,
    },
    kidInfoText: {
        color: '#444444',
    },
    taskName: {
        width: '45%',
        marginBottom: 10,
    },
    taskNameText: {
        fontWeight: 'bold',
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        backgroundColor: '#A8D5BA',
        padding: 16,
    },        
};

export default DashboardScreen;
