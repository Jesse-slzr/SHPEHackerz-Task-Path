import React, { useState, useEffect } from 'react';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../FirebaseConfig';
import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { 
    View, 
    Text, 
    FlatList,
    ActivityIndicator,
    TouchableOpacity, 
    Pressable, 
    Dimensions, 
    StyleSheet 
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGear, faTasks, faChild, faGift } from '@fortawesome/free-solid-svg-icons'; // Import specific icons
import { Dropdown } from 'react-native-element-dropdown';
import { BarChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';

interface Kid {
    kidId: string;
    name: string;
    age: number;
    id: string;
}

interface Task {
    taskId: string;
    date: string;
    taskName: string;
    taskStatus: string;
    rewardAMT: string;
    childId: string;
}
  
interface Week {
    label: string;
    startOfWeek: Date;
    endOfWeek: Date;
}

const DashboardScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [kids, setKids] = useState<Kid[]>([]);
    const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<Week>({ label: 'This Week', startOfWeek: new Date(), endOfWeek: new Date() });
    const [recentTasks, setRecentTasks] = useState([
        { taskId: '1', date: '2024-12-5', taskName: 'Task 1', taskStatus: 'Completed', rewardAMT: '5', childId: 'ce981757-81df-4e00-a756-cd3a4571bba1', childName: "Dustin" },
        { taskId: '2', date: '2024-12-3', taskName: 'Task 2', taskStatus: 'Completed', rewardAMT: '5', childId: 'ce981757-81df-4e00-a756-cd3a4571bba1', childName: "Dustin" },
        { taskId: '3', date: '2024-12-4', taskName: 'Task 3', taskStatus: 'In Progress', rewardAMT: '5', childId: 'ce981757-81df-4e00-a756-cd3a4571bba1', childName: "Dustin" },
        { taskId: '4', date: '2024-12-2', taskName: 'Task 4', taskStatus: 'Completed', rewardAMT: '10', childId: '7f7b3912-77d6-4571-91bf-1cfd3ace57e8', childName: "Yaneli" },
        { taskId: '5', date: '2024-12-7', taskName: 'Task 5', taskStatus: 'Completed', rewardAMT: '10', childId: 'ce981757-81df-4e00-a756-cd3a4571bba1', childName: "Dustin" },
    ]);

    // Dynamically fetch kids data
    useEffect(() => {
        const unsubscribe = fetchKids();
    
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Default to the current week for the dropdown
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

    // Fetch kids data dynamically from Firebase
    const fetchKids = () => {
        try {
            const kidsCollection = collection(FIRESTORE_DB, 'Kids');
            const q = query(kidsCollection);
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const fetchedKids: Kid[] = querySnapshot.docs.map((doc) => ({
                    kidId: doc.data().kidId,
                    ...doc.data(),
                    id: doc.id
                } as Kid));
                setKids(fetchedKids);
                if (fetchedKids.length > 0 && !selectedKid) {
                    setSelectedKid(fetchedKids[0]);
                }
            });
            return unsubscribe;
        } catch (error) {
            console.error('Error fetching kids:', error);
        } finally {
            setLoading(false);
        }
    };


    // Helper functions to get start and 
    // end dates of a week and format them
    const getStartOfWeek = (date: Date | null) => {
        if(!date){    
            var today = new Date();
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
        }
        else{
            var today = new Date(date);
        }
        var start = today.getDate() - today.getDay();
        var startOfWeek = new Date(today.setDate(start));
   
        return new Date(startOfWeek.setDate(startOfWeek.getDate() + 6 ));
    };
    
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

    // Helper function to set hours, minutes, seconds, and milliseconds to 0
    const normalizeDate = (date: Date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    // Function to get task data for each day of the week
    const getTaskDataForWeek = (): number[] => {
        if (!selectedKid || !selectedWeek) return Array(7).fill(0);
    
        const taskCountPerDay = Array(7).fill(0);
        const normalizedStart = normalizeDate(selectedWeek.startOfWeek);
        const normalizedEnd = normalizeDate(selectedWeek.endOfWeek);

        const filteredTasks = recentTasks.filter((task) => {
            const taskDate = normalizeDate(new Date(task.date));
            return (
                task.taskStatus === 'Completed' &&
                task.childId === selectedKid.kidId &&
                taskDate >= normalizedStart &&
                taskDate <= normalizedEnd
            );
        });
    
        filteredTasks.forEach((task) => {
            const taskDate = new Date(task.date);
            const dayIndex = taskDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            taskCountPerDay[dayIndex] += 1;
        });
        
        return taskCountPerDay;
    };
    

    const weeks = getAvailableWeeks();
    const taskDataForWeek = getTaskDataForWeek();


    // Get completed tasks sorted by date in descending order
    const getSortedCompletedTasks = () => {
        return recentTasks
            .filter(task => task.taskStatus === 'Completed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort tasks by date (most recent first)
    };

    // Render each task in the recent tasks list
    const renderTask = ({ item }: { item: Task }) => {
        const taskKid = kids.find(kid => kid.kidId === item.childId);
        
        return (
            <View style={styles.taskBubble}>
                <View style={styles.taskDate}>
                    <Text>{item.date}</Text>
                </View>
                <View style={styles.taskKidInfo}>
                    {/* Show the kid's name if found, otherwise fallback to a generic message */}
                    <Text style={styles.kidInfoText}>
                        Completed by Kid {taskKid ? taskKid.name : 'Unknown'}
                    </Text>
                </View>
                <View style={styles.taskName}>
                    <Text style={styles.taskNameText}>{item.taskName}</Text>
                </View>
            </View>
        );
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
            <View>    
                <FlatList
                    horizontal
                    data={kids}
                    keyExtractor={(item) => item.kidId}
                    renderItem={({ item: kid }) => (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                selectedKid?.kidId === kid.kidId ? styles.selectedTab : null,
                            ]}
                            onPress={() => setSelectedKid(kid)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    selectedKid?.kidId === kid.kidId ? styles.selectedTabText : null,
                                ]}
                            >
                                {kid.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.tabsContentContainer}
                />

                {/* Selected Kid's Details */}
                {selectedKid ? (
                    <View style={styles.detailsContainer}>
                        <Text style={styles.detailsText}>
                            Viewing details for: {selectedKid.name}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.noKidsText}>No kids available</Text>
                )}
            </View>

            {/* Section displaying tasks completed this week */}
            <View style={styles.graphSection}>
                <View style={styles.taskSummary}>
                    <Dropdown
                        style={styles.dropdown}
                        data={weeks.map((week) => ({ label: week.label, value: week, key: week.label }))}
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
                keyExtractor={(item) => item.taskId}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        marginVertical: 10,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginRight: 15,
        marginTop: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
    },
    selectedTab: {
        backgroundColor: '#A8D5BA',
    },
    tabText: {
        fontSize: 16,
        color: '#333',
    },
    selectedTabText: {
        fontWeight: 'bold',
        color: '#FFF',
    },
    tabsContentContainer: {
        paddingHorizontal: 10,
    },
    detailsContainer: {
        paddingTop: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
    },
    detailsText: {
        fontSize: 16,
        color: '#333',
    },
    noKidsText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
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
