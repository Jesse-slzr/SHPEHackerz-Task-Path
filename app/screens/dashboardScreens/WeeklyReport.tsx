import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { FIREBASE_DB as FIRESTORE_DB } from '../../../FirebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { 
    View, 
    Text, 
    ScrollView,
    StyleSheet,
    Dimensions,
    Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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

const WeeklyReport = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{
        kidId: string;
        kidName: string;
        startOfWeek: string;
        endOfWeek: string;
    }>();
    const kidId = params.kidId;
    const kidName = params.kidName;
    const startOfWeek = new Date(params.startOfWeek);
    const endOfWeek = new Date(params.endOfWeek);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeTasks = fetchTasks();
        const unsubscribeTaskCompletions = fetchTaskCompletions();

        return () => {
            unsubscribeTasks && unsubscribeTasks();
            unsubscribeTaskCompletions && unsubscribeTaskCompletions();
        };
    }, [kidId]);

    const fetchTasks = () => {
        const tasksCollection = collection(FIRESTORE_DB, 'Tasks');
        return onSnapshot(tasksCollection, (querySnapshot) => {
            const fetchedTasks: Task[] = querySnapshot.docs.map((doc) => ({
                taskId: doc.data().taskId,
                ...doc.data(),
                docId: doc.id,
            } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching tasks:', error);
        });
    };

    const fetchTaskCompletions = () => {
        const taskCompletionsCollection = collection(FIRESTORE_DB, 'TaskCompletions');
        const q = query(taskCompletionsCollection, where('kidId', '==', kidId));
        return onSnapshot(q, (querySnapshot) => {
            const fetchedTaskCompletions: TaskCompletion[] = querySnapshot.docs.map((doc) => ({
                taskCompletionId: doc.data().taskCompletionId,
                ...doc.data(),
                dateCompleted: doc.data().dateCompleted.toDate(),
                docId: doc.id,
            } as TaskCompletion));
            setTaskCompletions(fetchedTaskCompletions);
        }, (error) => {
            console.error('Error fetching task completions:', error);
        });
    };

    const normalizeDate = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const filteredCompletions = taskCompletions.filter((completion) => {
        const completionDate = normalizeDate(completion.dateCompleted);
        const start = normalizeDate(startOfWeek);
        const end = normalizeDate(endOfWeek);
        const isWithinRange = completionDate >= start && completionDate <= end;
        return isWithinRange;
    });

    const enrichedData = filteredCompletions.map((completion) => ({
        ...completion,
        taskName: completion.name,
        taskDescription: completion.description,
        taskCost: completion.cost,
        duration: completion.countupDuration || completion.countdownDuration || (completion.duration * 60),
        rating: completion.rating || 0,
    }));

    // Line Chart: Tasks per Day
    const taskDataForWeek = Array(7).fill(0);
    const labels: string[] = [];
    const start = normalizeDate(startOfWeek);
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(start);
        currentDay.setDate(start.getDate() + i);
        const month = (currentDay.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDay.getDate().toString().padStart(2, '0');
        labels.push(`${month}/${day}`); // Format as "MM/DD"
    }

    enrichedData.forEach((data) => {
        const completionDate = normalizeDate(data.dateCompleted);
        const dayIndex = Math.floor((completionDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
            taskDataForWeek[dayIndex]++;
        }
    });

    const lineChartData = {
        labels,
        datasets: [{
            data: taskDataForWeek,
            color: () => '#4CAF50',
        }],
    };

    // Pie Chart: Rating Distribution
    const ratingDistribution = [0, 0, 0, 0, 0]; // 1-5 stars
    enrichedData.forEach((data) => {
        if (data.rating) ratingDistribution[data.rating - 1]++;
    });
    const pieChartData = [
        { name: '★ - 1 Star', value: ratingDistribution[0], color: '#f44336' },
        { name: '★ - 2 Stars', value: ratingDistribution[1], color: '#FF9800' },
        { name: '★ - 3 Stars', value: ratingDistribution[2], color: '#FFEB3B' },
        { name: '★ - 4 Stars', value: ratingDistribution[3], color: '#8BC34A' },
        { name: '★ - 5 Stars', value: ratingDistribution[4], color: '#4CAF50' },
    ].filter(item => item.value > 0);

    // Insights
    const totalTasks = enrichedData.length;
    const totalDuration = enrichedData.reduce((sum, data) => sum + (data.duration || 0), 0) / 60; // minutes
    const avgRating = enrichedData.length > 0 ? enrichedData.reduce((sum, data) => sum + (data.rating || 0), 0) / enrichedData.length : 0;
    const totalCoins = enrichedData.reduce((sum, data) => sum + data.taskCost, 0);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A8D5BA" />
                <Text>Loading Report...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={24} color="black" />
                </Pressable>
                <Text style={styles.title}>Weekly Report for {kidName}</Text>
            </View>

            <Text style={styles.subtitle}>
                <Text style={styles.dateHighlight}>{startOfWeek.toLocaleDateString()}</Text> - <Text style={styles.dateHighlight}>{endOfWeek.toLocaleDateString()}</Text>
            </Text>

            {/* Insights Section */}
            <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <Text style={styles.insightText}>Total Tasks Completed: {totalTasks}</Text>
                <Text style={styles.insightText}>Total Time Spent: {totalDuration.toFixed(1)} minutes</Text>
                <Text style={styles.insightText}>Average Rating: {avgRating.toFixed(1)} ★</Text>
                <Text style={styles.insightText}>Total Coins Earned: {totalCoins}</Text>
            </View>

            {/* Tasks per Day Line Chart */}
            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Tasks Completed by Day</Text>
                <LineChart
                    data={lineChartData}
                    width={Dimensions.get('window').width - 60}
                    height={220}
                    fromZero
                    fromNumber={Math.max(...taskDataForWeek) > 4 ? Math.max(...taskDataForWeek) : 4 }
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                        backgroundColor: '#FFF',
                        backgroundGradientFrom: '#FFF',
                        backgroundGradientTo: '#FFF',
                        decimalPlaces: 0,
                        color: () => '#4CAF50',
                        labelColor: () => '#333',
                    }}
                    style={styles.chart}
                />
            </View>

            {/* Rating Distribution Pie Chart */}
            {pieChartData.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>Rating Distribution</Text>
                    <PieChart
                        data={pieChartData}
                        width={Dimensions.get('window').width - 40}
                        height={220}
                        chartConfig={{
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        accessor="value"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </View>
            )}

            {/* Task List */}
            <View style={styles.taskListSection}>
                <Text style={styles.sectionTitle}>Completed Tasks</Text>
                {enrichedData.length > 0 ? (
                    enrichedData.map((task) => (
                        <View key={task.taskCompletionId} style={styles.taskItem}>
                            <Text style={styles.taskTitle}>{task.taskName}</Text>
                            <Text style={styles.taskDetail}>Date: {task.dateCompleted.toLocaleDateString()}</Text>
                            <Text style={styles.taskDetail}>Duration: {(task.duration / 60).toFixed(1)} min</Text>
                            <Text style={styles.taskDetail}>Rating: {task.rating || 'N/A'} ★</Text>
                            <Text style={styles.taskDetail}>Coins: {task.taskCost}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noTasks}>No tasks completed this week.</Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        backgroundColor: '#A8D5BA',
        padding: 16,
        paddingTop: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 108,
    },
    backButton: {
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 10,
    },
    dateHighlight: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    insightsSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    insightText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    chartSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    chart: {
        borderRadius: 10,
    },
    taskListSection: {
        padding: 20,
    },
    taskItem: {
        backgroundColor: '#E8F5E9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#A8D5BA',
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    taskDetail: {
        fontSize: 16,
        color: '#666',
    },
    noTasks: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default WeeklyReport;