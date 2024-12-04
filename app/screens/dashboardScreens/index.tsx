import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, Dimensions, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGear, faTasks, faChild, faGift } from '@fortawesome/free-solid-svg-icons'; // Import specific icons
import { Dropdown } from 'react-native-element-dropdown';
import { BarChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';

// Types for task and week
interface Task {
    id: string;
    date: string;
    taskName: string;
    taskStatus: string;
    rewardAMT: string;
    childID: string;
}
  
interface Week {
    label: string;
    startOfWeek: Date;
    endOfWeek: Date;
}

const DashboardScreen = () => {
    const router = useRouter();
    const [selectedKid, setSelectedKid] = useState('1');
    const [selectedWeek, setSelectedWeek] = useState<Week>({ label: 'This Week', startOfWeek: new Date(), endOfWeek: new Date() });
    const [recentTasks, setRecentTasks] = useState([
        { id: '1', date: '2024-11-10', taskName: 'Task 1', taskStatus: 'Completed', rewardAMT: '5', childID: '1' },
        { id: '2', date: '2024-12-3', taskName: 'Task 2', taskStatus: 'Completed', rewardAMT: '5', childID: '1' },
        { id: '3', date: '2024-12-3', taskName: 'Task 3', taskStatus: 'In Progress', rewardAMT: '5', childID: '2' },
        { id: '4', date: '2024-12-3', taskName: 'Task 4', taskStatus: 'Completed', rewardAMT: '10', childID: '2' },
        { id: '5', date: '2024-12-3', taskName: 'Task 5', taskStatus: 'Completed', rewardAMT: '10', childID: '1' },
    ]);

    // Initialize selected week in useEffect to avoid overwriting it during render
    useEffect(() => {
        const currentDate = new Date();
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = getEndOfWeek(currentDate);
        const currentWeek = { 
            label: `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`, 
            startOfWeek, 
            endOfWeek 
        };
        setSelectedWeek(currentWeek); // Set the current week as default
    }, []);

    // Helper functions
    const getStartOfWeek = (date: Date | null) => {
        if(!date){    
            var today = new Date();
            console.log("Today", today);
        }
        else{
            var today = new Date(date);
        }
        var start = today.getDate() - today.getDay();
        return new Date(today.setDate(start));
    };
    
    const getEndOfWeek = (date: Date | null) => {
        if(!date){    
            var today = new Date();
            console.log("Today", today);
        }
        else{
            var today = new Date(date);
        }
        var start = today.getDate() - today.getDay();
        var startOfWeek = new Date(today.setDate(start));
   
        return new Date(startOfWeek.setDate(startOfWeek.getDate() + 6 ));

        // return endOfWeek;
    };
    console.log("Weeksss", getStartOfWeek(null), getEndOfWeek(null));
    
    const formatDate = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = (date.getDate() + 1).toString().padStart(2, '0');
        return `${month}/${day}`;
    };
    
    // Generate available week options based on recentTasks
    const getAvailableWeeks = (): Week[] => {
        const weeks: Week[] = [];
        const uniqueWeeks = new Set<string>();
        
        // Add the current week first
        const currentDate = new Date();
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = getEndOfWeek(currentDate);
        const label = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

        if (!uniqueWeeks.has(label)) {
            uniqueWeeks.add(label);
            weeks.push({ label, startOfWeek, endOfWeek });
        }

        // Add weeks from recent tasks
        recentTasks.forEach((task) => {
            const taskDate = new Date(task.date);
            const startOfWeek = getStartOfWeek(taskDate);
            const endOfWeek = getEndOfWeek(taskDate);
            const label = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

            if (!uniqueWeeks.has(label)) {
                uniqueWeeks.add(label);
                weeks.push({ label, startOfWeek, endOfWeek });
            }
        });

        // Sort weeks by their start dates
        weeks.sort((a, b) => a.startOfWeek.getTime() - b.startOfWeek.getTime());

        return weeks;
    };

    // Get completed tasks sorted by date in descending order
    const getSortedCompletedTasks = () => {
        return recentTasks
            .filter(task => task.taskStatus === 'Completed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort tasks by date (most recent first)
    };

    const onWeekSelect = (week: Week) => {
        setSelectedWeek(week);
    };

    // Get task data for week
    const getTaskDataForWeek = (): number[] => {
        const taskCountPerDay = Array(7).fill(0);
        const filteredTasks = recentTasks.filter(
          (task) =>
            task.taskStatus === 'Completed' &&
            task.childID === selectedKid &&
            selectedWeek &&
            new Date(task.date) >= selectedWeek.startOfWeek &&
            new Date(task.date) <= selectedWeek.endOfWeek
        );
    
        filteredTasks.forEach((task) => {
          const taskDate = new Date(task.date);
          const dayIndex = taskDate.getDay();
          taskCountPerDay[dayIndex] += 1;
        });
        return taskCountPerDay;
    };

    const taskDataForWeek = getTaskDataForWeek();
    const weeks = getAvailableWeeks();

    // Render each task in the recent tasks list
    const renderTask = ({ item }: { item: Task }) => (
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
                <Pressable onPress={() => router.push('../../(auth)/SignOut')} style={styles.headerButton}>
                    <FontAwesomeIcon icon={faGear} size={24} color="black" />
                </Pressable>
                <Pressable style={styles.kidsViewButton} onPress={() => router.push({pathname: '../../../screens/kidsViewScreens'})}>
                    <Text style={styles.kidsViewButtonText}>Enter Kids View</Text>
                </Pressable>
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
                    <Dropdown
                        style={styles.dropdown}
                        data={weeks.map((week) => ({ label: week.label, value: week }))}
                        labelField="label"
                        valueField="value"
                        placeholder={selectedWeek?.label}
                        value={selectedWeek?.label}
                        onChange={(item) => setSelectedWeek(item.value)}
                    />
                    <Text style={styles.taskSummaryCount}>{taskDataForWeek.reduce((sum, val) => sum + val, 0)} Tasks</Text>
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
                    yAxisSuffix=''
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
        </View>
    );
};

// Styles for the component
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF'
    },
    header: {
        padding: 16,
        paddingTop: 48,
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
    dropdown: {
        height: 25,
        width: '45%',
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
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
        paddingBottom: 48,
    },        
});

export default DashboardScreen;
