import React, { useState, useEffect } from 'react';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../FirebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { 
    View, 
    Text, 
    FlatList,
    ActivityIndicator,
    TouchableOpacity, 
    Pressable, 
    Dimensions, 
    StyleSheet,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGear, faTasks, faChild, faGift } from '@fortawesome/free-solid-svg-icons';
import { Dropdown } from 'react-native-element-dropdown';
import { BarChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import uuid from 'react-native-uuid';
import { getAuth } from 'firebase/auth';
import { updateUserTypeToKid } from "../../../utils/firebaseUtils";

interface Kid {
    kidId: string;
    name: string;
    age: number;
    id: string;
    parentUuid: string;
}

interface Task {
    docId: string;
    taskId: string;
    name: string;
    description: string;
    cost: number;
    childId: string;
    duration: number;
    timerType: 'countdown' | 'countup';
}

interface TaskCompletion {
    docId: string;
    taskCompletionId: string;
    kidId: string;
    taskId: string;
    name: string;
    description: string;
    cost: number;
    duration: number;
    timerType: 'countdown' | 'countup';
    dateCompleted: Date;
    countupDuration?: number;
    countdownDuration?: number;
    rating?: number;
    taskRemoved?: boolean;
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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);

    useEffect(() => {
        // Subscribe to real-time updates from Firestore
        const unsubscribeKids = fetchKids();
        const unsubscribeTasks = fetchTasks();
        const unsubscribeTaskCompletions = fetchTaskCompletions();

        return () => {
            // Cleanup Firestore listeners when component unmounts
            unsubscribeKids && unsubscribeKids();
            unsubscribeTasks && unsubscribeTasks();
            unsubscribeTaskCompletions && unsubscribeTaskCompletions();
        };
    }, []);

    useEffect(() => {
        // Set the default week selection to the current week
        const currentDate = new Date();
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = getEndOfWeek(currentDate);
        setSelectedWeek({
            label: `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`,
            startOfWeek,
            endOfWeek,
        });
    }, []);


    const handleKidView = async () => {
        await updateUserTypeToKid();
        router.push("../../screens/kidsViewScreens");
    };

    const handleGenerateReport = () => {
        router.push({
            pathname: '/screens/dashboardScreens/report',
            params: {
                kidId: selectedKid?.kidId,
                kidName: selectedKid?.name,
                startOfWeek: selectedWeek.startOfWeek.toISOString(),
                endOfWeek: selectedWeek.endOfWeek.toISOString(),
            },
        });
    };
    
    // Fetch kids from Firestore based on the logged-in parent's ID
    const auth = getAuth();
    const parentUuid = auth.currentUser?.uid || '';
    const fetchKids = () => {
        try {
            const kidsCollection = collection(FIRESTORE_DB, 'Kids');
            const q = query(kidsCollection, where('parentUuid', '==', parentUuid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const fetchedKids: Kid[] = querySnapshot.docs.map((doc) => ({
                    kidId: doc.data().kidId,
                    parentUuid: doc.data().parentUuid,
                    ...doc.data(),
                    id: doc.id
                } as Kid));
                setKids(fetchedKids);
                // Auto-select the first kid if none is selected
                if (fetchedKids.length > 0 && !selectedKid) {
                    setSelectedKid(fetchedKids[0]);
                }
                setLoading(false);
            });
            return unsubscribe;
        } catch (error) {
            console.error('Error fetching kids:', error);
            setLoading(false);
        }
    };

    // Fetch all tasks from Firestore
    const fetchTasks = () => {
        try {
            const tasksCollection = collection(FIRESTORE_DB, 'Tasks');
            return onSnapshot(tasksCollection, (querySnapshot) => {
                const fetchedTasks: Task[] = querySnapshot.docs.map((doc) => ({
                    docId: doc.id,
                    taskId: doc.data().taskId,
                    name: doc.data().name,
                    description: doc.data().description,
                    cost: doc.data().cost,
                    childId: doc.data().childId || "",
                    duration: doc.data().duration || 0,
                    timerType: doc.data().timerType || 'countup'
                } as Task));
                setTasks(fetchedTasks);
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Fetch all task completions from Firestore
    const fetchTaskCompletions = () => {
        try {
            const taskCompletionsCollection = collection(FIRESTORE_DB, 'TaskCompletions');
            return onSnapshot(taskCompletionsCollection, (querySnapshot) => {
                const fetchedTaskCompletions: TaskCompletion[] = querySnapshot.docs.map((doc) => {
                    return {
                        taskCompletionId: doc.data().taskCompletionId,
                        ...doc.data(),
                        dateCompleted: doc.data().dateCompleted.toDate(),
                        docId: doc.id
                    } as TaskCompletion;
                });
                setTaskCompletions(fetchedTaskCompletions);
            });
        } catch (error) {
            console.error('Error fetching task completions:', error);
        }
    };

    // Helper functions to get start and 
    // end dates of a week and format them
    const getStartOfWeek = (date: Date) => {
        const dayOfWeek = date.getDay();
        const diffToSunday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - diffToSunday);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    };

    const getEndOfWeek = (date: Date) => {
        const startOfWeek = getStartOfWeek(date);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    };
    
    const normalizeDate = (date: Date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    const formatDate = (date: Date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
    };

    // Generate available week options based on recentTasks
    const getAvailableWeeks = (): Week[] => {
        const weeks: Week[] = [];
        const uniqueWeeks = new Set<string>();
        const kidTaskCompletions = taskCompletions.filter((completion) => completion.kidId === selectedKid?.kidId);

        kidTaskCompletions.forEach((task) => {
            const taskDate = new Date(task.dateCompleted);
            const startOfWeek = getStartOfWeek(taskDate);
            const endOfWeek = getEndOfWeek(taskDate);
            const label = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

            if (!uniqueWeeks.has(label)) {
                uniqueWeeks.add(label);
                weeks.push({ label, startOfWeek, endOfWeek });
            }
        });

        weeks.sort((a, b) => a.startOfWeek.getTime() - b.startOfWeek.getTime());
        return weeks;
    };

    // Function to get task data for each day of the week
    const getTaskDataForWeek = (): number[] => {
        if (!selectedKid || !selectedWeek) return Array(7).fill(0);

        const taskCountPerDay = Array(7).fill(0);
        taskCompletions.forEach((completion) => {
            if (completion.kidId === selectedKid.kidId) {
                const completionDate = normalizeDate(completion.dateCompleted);
                const dayIndex = (completionDate.getDay() + 6) % 7;
                if (completionDate >= normalizeDate(selectedWeek.startOfWeek) && completionDate <= normalizeDate(selectedWeek.endOfWeek)) {
                    taskCountPerDay[dayIndex]++;
                }
            }
        });

        return taskCountPerDay;
    };
    
    // Helper function to check if there are completed tasks for the selected kid and week
    const hasCompletedTasks = (): boolean => {
        if (!selectedKid || !selectedWeek) return false;

        return taskCompletions.some((completion) => {
            const completionDate = normalizeDate(completion.dateCompleted);
            return (
                completion.kidId === selectedKid.kidId &&
                completionDate >= normalizeDate(selectedWeek.startOfWeek) &&
                completionDate <= normalizeDate(selectedWeek.endOfWeek)
            );
        });
    };

    const taskDataForWeek = getTaskDataForWeek();
    const barChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                data: taskDataForWeek,
                color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                strokeWidth: 2,
            },
        ],
    };

    const renderTask = ({ item }: { item: TaskCompletion }) => (
        <View style={styles.taskBubble}>
            <View style={styles.taskDate}>
            <Text>{item.dateCompleted.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</Text>
            </View>
            <View style={styles.taskName}>
                <Text style={styles.taskNameText}>{item.name}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A8D5BA" />
            <Text>Loading...</Text>
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
                <Pressable style={styles.kidsViewButton} onPress={handleKidView}>
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
                        data={getAvailableWeeks()}
                        labelField="label"
                        valueField="label"
                        value={selectedWeek.label}
                        onChange={(item) => setSelectedWeek(item)}
                    />
                    <Text style={styles.taskSummaryCount}>{taskDataForWeek.reduce((sum, val) => sum + val, 0)} Tasks</Text>
                </View>
                <BarChart
                    data={barChartData}
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
                {hasCompletedTasks() && (
                    <Pressable style={styles.reportButton} onPress={handleGenerateReport}>
                        <Text style={styles.reportButtonText}>Show Full Report</Text>
                    </Pressable>
                )}
            </View>
            
            {/* Recent tasks section */}
            <Text style={styles.recentTasks}>Completed Tasks</Text>
            <FlatList
                data={taskCompletions.filter(
                    (completion) =>
                        completion.kidId === selectedKid?.kidId &&
                        normalizeDate(completion.dateCompleted) >= normalizeDate(selectedWeek.startOfWeek) &&
                        normalizeDate(completion.dateCompleted) <= normalizeDate(selectedWeek.endOfWeek)
                )}
                keyExtractor={(item) => item.taskId}
                renderItem={renderTask}
                ListEmptyComponent={<Text style={styles.noCompletedTasks}>No completed tasks.</Text>}
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
        alignItems: 'center' 
    },
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
        borderWidth: 1,
        backgroundColor: '#fff',
        borderColor: '#A8D5BA',
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        borderBottomWidth: 3,
        borderBottomColor: '#A8D5BA',
        borderRightWidth: 4,
        borderRightColor: '#A8D5BA',
        borderRadius: 20,
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
    noCompletedTasks:{
        padding: 10,
        marginLeft: 10
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
