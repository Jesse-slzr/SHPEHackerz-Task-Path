import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, FlatList, Pressable, SafeAreaView } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../../../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { LineChart } from 'react-native-chart-kit';
import { Svg, Circle, Line, Text as SvgText } from 'react-native-svg';
import * as d3 from 'd3';
import { useRouter } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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

interface Kid {
  kidId: string;
  name: string;
  coinCount: number;
  parentId: string;
}

interface ScatterData {
  x: number | undefined; // Rating
  y: number; // Time to complete
  taskName: string; // Task name for legend
}

const screenWidth = Dimensions.get('window').width;

const FullReportScreen = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = FIREBASE_AUTH();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      if (!user) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchKids = async () => {
      try {
        const kidsRef = collection(FIREBASE_DB, 'Kids');
        const kidsQuery = query(kidsRef, where('parentUuid', '==', userId));
        const kidsSnapshot = await getDocs(kidsQuery);

        const fetchedKids: Kid[] = kidsSnapshot.docs.map((doc) => ({
          kidId: doc.data().kidId,
          name: doc.data().name,
          coinCount: doc.data().coinCount || 0,
          parentId: doc.data().parentUuid,
        }));
        setKids(fetchedKids);
        if (fetchedKids.length > 0) {
          setSelectedKid(fetchedKids[0]);
        } else {
          setError('No kids found for this parent.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching kids:', error);
        setError('Failed to fetch kids.');
        setLoading(false);
      }
    };

    fetchKids();
  }, [userId]);

  useEffect(() => {
    if (!selectedKid?.kidId) return;

    const fetchCompletions = async () => {
      setLoading(true);
      try {
        const completionsRef = collection(FIREBASE_DB, 'TaskCompletions');
        const completionsQuery = query(completionsRef, where('kidId', '==', selectedKid.kidId));
        const completionsSnapshot = await getDocs(completionsQuery);

        const fetchedCompletions: TaskCompletion[] = completionsSnapshot.docs.map((doc) => ({
          taskCompletionId: doc.data().taskCompletionId,
          kidId: doc.data().kidId,
          taskId: doc.data().taskId,
          name: doc.data().name,
          description: doc.data().description,
          cost: doc.data().cost,
          duration: doc.data().duration,
          timerType: doc.data().timerType,
          dateCompleted: doc.data().dateCompleted.toDate(),
          countupDuration: doc.data().countupDuration,
          countdownDuration: doc.data().countdownDuration,
          rating: doc.data().rating,
          taskRemoved: doc.data().taskRemoved ?? false,
          docId: doc.id,
        }));

        const filteredCompletions = fetchedCompletions.filter((c) => !c.taskRemoved);
        setCompletions(filteredCompletions);
      } catch (error) {
        console.error('Error fetching completions:', error);
        setError('Failed to fetch completions.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletions();
  }, [selectedKid]);

  const getTimeToComplete = (completion: TaskCompletion) => {
    if (completion.timerType === 'countup') {
      return (completion.countupDuration ?? 0) / 60; // seconds to minutes
    } else {
      const timeInSeconds = completion.countdownDuration ?? (completion.duration * 60);
      return timeInSeconds / 60; // seconds to minutes
    }
  };

  const processTaskCompletionTrend = () => {
    const today = new Date();
    const startOfPeriod = new Date(today);
    startOfPeriod.setDate(today.getDate() - 42); // 6 weeks back from today
    const startSunday = new Date(startOfPeriod);
    startSunday.setDate(startOfPeriod.getDate() - startOfPeriod.getDay()); // Adjust to Sunday

    const normalizeDate = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const filteredCompletions = completions.filter((completion) => {
      const completionDate = normalizeDate(completion.dateCompleted);
      return completionDate >= startSunday && completionDate <= today;
    });

    const completionsByWeek: { [key: string]: number } = {};
    filteredCompletions.forEach((completion) => {
      const date = normalizeDate(completion.dateCompleted);
      const dayOfWeek = date.getDay();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - dayOfWeek);
      const weekKey = weekStart.toLocaleDateString();
      completionsByWeek[weekKey] = (completionsByWeek[weekKey] || 0) + 1;
    });

    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 0; i < 7; i++) {
      const currentWeekStart = new Date(startSunday);
      currentWeekStart.setDate(startSunday.getDate() + (i * 7));
      const month = (currentWeekStart.getMonth() + 1).toString().padStart(2, '0');
      const day = currentWeekStart.getDate().toString().padStart(2, '0');
      const label = `${month}/${day}`;
      const weekKey = currentWeekStart.toLocaleDateString();
      labels.push(label);
      data.push(completionsByWeek[weekKey] || 0);
    }

    return { labels, data };
  };

  const processTimeSpentByDay = () => {
    const today = new Date();
    const startOfPeriod = new Date(today);
    startOfPeriod.setDate(today.getDate() - 42); // 6 weeks back from today
    const startSunday = new Date(startOfPeriod);
    startSunday.setDate(startOfPeriod.getDate() - startOfPeriod.getDay()); // Adjust to Sunday

    const normalizeDate = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const filteredCompletions = completions.filter((completion) => {
      const completionDate = normalizeDate(completion.dateCompleted);
      return completionDate >= startSunday && completionDate <= today;
    });

    const timeByWeek: { [key: string]: number } = {};
    filteredCompletions.forEach((completion) => {
      const date = normalizeDate(completion.dateCompleted);
      const dayOfWeek = date.getDay();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - dayOfWeek);
      const weekKey = weekStart.toLocaleDateString();
      const time = completion.timerType === 'countup'
        ? (completion.countupDuration ?? 0) / 60
        : (completion.countdownDuration ?? completion.duration * 60) / 60;
      timeByWeek[weekKey] = (timeByWeek[weekKey] || 0) + time;
    });

    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 0; i < 7; i++) {
      const currentWeekStart = new Date(startSunday);
      currentWeekStart.setDate(startSunday.getDate() + (i * 7));
      const month = (currentWeekStart.getMonth() + 1).toString().padStart(2, '0');
      const day = currentWeekStart.getDate().toString().padStart(2, '0');
      const label = `${month}/${day}`;
      const weekKey = currentWeekStart.toLocaleDateString();
      labels.push(label);
      data.push(timeByWeek[weekKey] || 0);
    }

    return {
      labels,
      datasets: [{ data }],
    };
  };

  const scatterData: ScatterData[] = completions
    .filter(completion => completion.rating !== undefined)
    .map(completion => ({
      x: completion.rating,
      y: getTimeToComplete(completion),
      taskName: completion.name,
    }));

  const width = screenWidth - 40;
  const height = 220;
  const padding = 40;

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(168, 213, 186, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '0' },
    propsForLines: { strokeWidth: 0 },
  };

  const maxTasks = Math.max(...processTaskCompletionTrend().data, 4);
  const yAxisMax = Math.ceil(maxTasks / 2) * 2;

  // Scales for Graph 6
  const xScale = d3.scaleLinear()
    .domain([1, 5])
    .range([padding, width - padding]);
  const minTime = d3.min(scatterData, d => d.y) || 0;
  const maxTime = d3.max(scatterData, d => d.y) || 5; // Default to 5 if no data
  const timeRange = maxTime - minTime;
  const tickCount = Math.min(6, Math.max(4, Math.ceil(timeRange / 0.5))); // Aim for 4–6 ticks
  const stepSize = timeRange > 0 ? timeRange / (tickCount - 1) : 0.5; // Ensure non-zero step
  const yTicks = d3.range(minTime, maxTime + stepSize, stepSize).map(t => Number(t.toFixed(1)));
  const yScale = d3.scaleLinear()
    .domain([minTime, maxTime])
    .range([height - padding, padding]);

  // Generate unique colors for each task
  const uniqueTasks = [...new Set(scatterData.map(item => item.taskName))];
  const colors = [
    '#A8D5BA', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5',
    '#9B59B6', '#3498DB', '#E74C3C',
  ];
  const taskColorMap = new Map<string, string>();
  uniqueTasks.forEach((task, index) => {
    taskColorMap.set(task, colors[index % colors.length]);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('../../(auth)/SignOut')} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerText}>Parent Report</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading Report...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !userId ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No authenticated user found. Please log in.</Text>
        </View>
      ) : (
        <ScrollView style={styles.container}>
          <View style={styles.kidTabsContainer}>
            <Text style={styles.kidTabsLabel}>Select Child:</Text>
            <FlatList
              horizontal
              data={kids}
              keyExtractor={(item) => item.kidId}
              renderItem={({ item: kid }) => (
                <TouchableOpacity
                  style={[
                    styles.kidTab,
                    selectedKid?.kidId === kid.kidId ? styles.selectedKidTab : null,
                  ]}
                  onPress={() => setSelectedKid(kid)}
                >
                  <Text
                    style={[
                      styles.kidTabText,
                      selectedKid?.kidId === kid.kidId ? styles.selectedKidTabText : null,
                    ]}
                  >
                    {kid.name}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.kidTabsContentContainer}
            />
            {selectedKid ? (
              <View style={styles.kidDetailsContainer}>
                <Text style={styles.kidDetailsText}>Reports for: {selectedKid.name}</Text>
              </View>
            ) : (
              <Text style={styles.noKidsText}>No kids available</Text>
            )}
          </View>

          {/* Graph 1: Task Completion Trend */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Task Completion Trend (Last 7 Weeks)</Text>
            <LineChart
              data={{
                labels: processTaskCompletionTrend().labels,
                datasets: [{ data: processTaskCompletionTrend().data }],
              }}
              width={screenWidth - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" tasks"
              fromZero={true}
              yAxisInterval={2}
              fromNumber={yAxisMax}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Graph 3: Time Spent by Week */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Time Spent by Week (Last 7 Weeks)</Text>
            <LineChart
              data={processTimeSpentByDay()}
              width={screenWidth - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" min"
              fromZero={true}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Graph 6: Task Completion Time vs Difficulty Rating */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Task Completion Time vs Difficulty Rating</Text>
            {scatterData.length > 0 ? (
              <>
                <Svg width={width} height={height}>
                  {/* X-axis */}
                  <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="2" />
                  <SvgText x={width / 2} y={height - 10} textAnchor="middle" fontSize="12">Difficulty Rating</SvgText>

                  {/* Y-axis */}
                  <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" strokeWidth="2" />
                  <SvgText x={10} y={height / 2} textAnchor="middle" fontSize="12" transform={`rotate(-90, 10, ${height / 2})`}>Time to Complete (min)</SvgText>

                  {/* X-axis labels */}
                  {[1, 2, 3, 4, 5].map(rating => (
                    <SvgText
                      key={rating}
                      x={xScale(rating)}
                      y={height - padding + 15}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#333"
                    >
                      {rating}
                    </SvgText>
                  ))}

                  {/* Y-axis labels with dynamic ticks */}
                  {yTicks.map(time => (
                    <SvgText
                      key={time}
                      x={padding - 10}
                      y={yScale(time) + 5}
                      textAnchor="end"
                      fontSize="10"
                      fill="#333"
                    >
                      {time}
                    </SvgText>
                  ))}

                  {/* Data points with task-specific colors */}
                  {scatterData.map((item, index) => (
                    <Circle
                      key={index}
                      cx={xScale(item.x ?? 0)}
                      cy={yScale(item.y ?? 0)}
                      r={5}
                      fill={taskColorMap.get(item.taskName) || '#A8D5BA'}
                    />
                  ))}
                </Svg>
                {/* Legend */}
                <FlatList
                  data={uniqueTasks.map(task => ({ taskName: task, color: taskColorMap.get(task) || '#A8D5BA' }))}
                  keyExtractor={(item) => item.taskName}
                  renderItem={({ item }) => (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendText}>{item.taskName}</Text>
                    </View>
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.legendContainer}
                />
              </>
            ) : (
              <Text>No difficulty rating data available.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#A8D5BA',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#A8D5BA',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 10,
    padding: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  kidTabsContainer: {
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  kidTabsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  kidTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedKidTab: {
    backgroundColor: '#A8D5BA',
    borderColor: '#4CAF50',
  },
  kidTabText: {
    fontSize: 16,
    color: '#555',
  },
  selectedKidTabText: {
    fontWeight: 'bold',
    color: '#000',
  },
  kidTabsContentContainer: {
    paddingHorizontal: 5,
  },
  kidDetailsContainer: {
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  kidDetailsText: {
    fontSize: 16,
    color: '#333',
  },
  noKidsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 15,
  },
  chartContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // MODIFIED: Added background color to match the main container
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // ADDED: Ensure consistent background
  },
  errorText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 15,
  },
  legendContainer: {
    marginTop: 10,
    maxHeight: 50,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
});

export default FullReportScreen;