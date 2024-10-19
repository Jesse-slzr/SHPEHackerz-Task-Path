import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faTasks, faChild, faGift } from '@fortawesome/free-solid-svg-icons'; // Import specific icons
import { BarChart } from 'react-native-chart-kit'; // Import BarChart

// Styles for the component
const styles = {
  container: {
    flex: 1, // Full height of the screen
    backgroundColor: '#FFF', // Light grey background
  },
  header: {
    padding: 16, // Padding around the header
    backgroundColor: '#A8D5BA', // Header background color
    flexDirection: 'row', // Arrange header elements in a row
    justifyContent: 'space-between', // Space between header elements
    alignItems: 'center', // Center elements vertically
  },
  title: {
    fontSize: 30, // Font size for the title
    fontWeight: 'bold', // Bold title font
    paddingHorizontal: 16, // Padding around the title
    paddingTop: 16, // Padding above the title
  },
  kidTabs: {
    flexDirection: 'row', // Arrange kid tabs in a row
    marginTop: 16, // Vertical spacing for tabs
    paddingHorizontal: 16, // Padding around the title
  },
  graphSection: {
    marginBottom: 5, // Vertical spacing for the graph section
    paddingHorizontal: 16, // Padding around the title
    // alignSelf: 'center', // Center the bubble horizontally
  },
  recentTasks: {
    fontSize: 20, // Font size for recent tasks heading
    fontWeight: 'bold', // Bold font for heading
    marginBottom: 10, // Space below the heading
    paddingHorizontal: 16, // Padding around the title
  },
  taskBubble: {
    padding: 12, // Padding inside each task bubble
    backgroundColor: '#E8F5E9', // Bubble background color
    borderRadius: 40, // Circular shape for the bubble
    borderColor: "#000", // Border color for the bubble
    borderWidth: 1, // Border width for the bubble
    marginBottom: 10, // Space below each bubble
    flex: 1, // Full width of the bubble
    flexDirection: 'row', // Arrange items in a row
    flexWrap: 'wrap', // Wrap items if they don't fit
    alignItems: 'flex-start', // Align items to the top
    width: '75%', // Set the width to 75%
    alignSelf: 'center', // Center the bubble horizontally
  },
  bottomNavigation: {
    flexDirection: 'row', // Arrange navigation items in a row
    justifyContent: 'space-around', // Evenly space navigation items
    marginTop: 20, // Space above the navigation bar
    backgroundColor: '#A8D5BA', // Background color for navigation
    padding: 16, // Padding around navigation items
  },
};

const DashboardScreen = () => {
  const [selectedKid, setSelectedKid] = useState('1');

  // Sample data for recent tasks
  const [recentTasks, setRecentTasks] = useState([
    { id: '1', date: '2024-10-16', taskName: 'Task 1', taskStatus: 'Completed', rewardAMT: '5', childID: '1' },
    { id: '2', date: '2024-10-16', taskName: 'Task 2', taskStatus: 'Completed', rewardAMT: '5', childID: '1' },
    { id: '3', date: '2024-10-16', taskName: 'Task 3', taskStatus: 'In Progress', rewardAMT: '5', childID: '2' },
    { id: '4', date: '2024-10-19', taskName: 'Task 4', taskStatus: 'Completed', rewardAMT: '10', childID: '2' },
    { id: '5', date: '2024-10-19', taskName: 'Task 5', taskStatus: 'Completed', rewardAMT: '10', childID: '1' },
  ]);

  const getTaskDataForWeek = () => {
    const taskCountPerDay = Array(7).fill(0); // Array with 7 entries for each day (Mon-Sun)

    // Get current date to determine the week
    const currentDate = new Date();
    
    // Filter tasks based on the selected kid
    const filteredTasks = recentTasks.filter(task => task.childID === selectedKid);

    // Iterate through the filtered tasks to count tasks per day
    filteredTasks.forEach(task => {
      if (task.taskStatus === 'Completed') { // Only count completed tasks
        const taskDate = new Date(task.date);
        const dayDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24)); // Difference in days

        if (dayDiff >= 0 && dayDiff < 7) { // Task is within the current week
          taskCountPerDay[taskDate.getDay()] += 1; // Increment task count for the respective day
        }
      }
    });

    return taskCountPerDay;
  };

  const taskDataForWeek = getTaskDataForWeek();


  // Render each task in the recent tasks list
  const renderItem = ({ item }) => (
    <View style={styles.taskBubble}>
      <View style={{width: '45%', marginBottom:10}}>
        <Text>{item.date}</Text>
      </View>
      <View style={{width: '50%', marginBottom:10}}>
        <Text style={{ color: '#444444' }}>Completed by Kid {item.childID}</Text>
      </View>
      <View style={{width: '45%', marginBottom:10}}>
        <Text style={{ fontWeight: 'bold' }}>{item.taskName}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with settings and navigation to kids view */}
      <View style={styles.header}>
        <TouchableOpacity style={{ padding: 10 }}>
          <View>
            <FontAwesomeIcon icon={faBars} size={24} color="black" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 10, backgroundColor: '#fff', borderRadius: 10 }}>
          <Text style={{ color: '#000', fontWeight: 'bold' }}>Enter Kids View</Text>
        </TouchableOpacity>
      </View>

      {/* Main title of the dashboard */}
      <View>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Tabs to switch between kids */}
      <View style={styles.kidTabs}>
        <TouchableOpacity 
          style={{ padding: 10, borderBottomWidth: selectedKid === '1' ? 2 : 0, borderBottomColor: '#000' }}
          onPress={() => setSelectedKid('1')}
        >
          <Text>Kid 1</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ padding: 10, borderBottomWidth: selectedKid === '2' ? 2 : 0, borderBottomColor: '#000' }}
          onPress={() => setSelectedKid('2')}
        >
          <Text>Kid 2</Text>
        </TouchableOpacity>
      </View>

      {/* Section displaying tasks completed this week */}
      <View style={styles.graphSection}>
      <View style={{
        margin: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'baseline',
      }}>
        <Text style={{fontSize: 24, lineHeight: 24, fontWeight: 'bold' }}>
          {taskDataForWeek.reduce((sum, val) => sum + val, 0)} Tasks
        </Text>
        <Text style={{fontSize: 20, lineHeight: 20}}>
          This week
        </Text>
      </View>
        {/* <Text style={{ fontSize: 20 }}>This week</Text>
        <Text style={{ fontSize: 40, fontWeight: 'bold' }}>{taskDataForWeek.reduce((sum, val) => sum + val, 0)} Tasks</Text> */}
        <BarChart
          data={{
            labels: ['M', 'T', 'W', 'TH', 'F', 'S', 'S'], // Days of the week
            datasets: [{ data: taskDataForWeek }] // Task data per day
          }}
          width={Dimensions.get('window').width - 30} // Width of the chart
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
          style={{
            borderRadius: 10,
            marginVertical: 8,
            alignSelf: 'center'
          }}
        />
        {/* Button to generate a report */}
        <TouchableOpacity style={{ marginTop: 10, padding: 5, backgroundColor: '#A8D5BA', borderRadius: 15, width: '35%', alignSelf: 'center' }}>
          <Text style={{ color: '#000', textAlign: 'center' }}>Generate Report</Text>
        </TouchableOpacity>
      </View>

      {/* Recent tasks section */}
      <Text style={styles.recentTasks}>Recent Tasks</Text>
      <FlatList
        data={recentTasks} // Data source for the FlatList
        keyExtractor={(item) => item.id} // Unique key for each task
        renderItem={renderItem} // Function to render each task
        ListEmptyComponent={<Text>No recent tasks.</Text>} // Message when no tasks are present
      />

      {/* Bottom navigation with icons */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity>
          <View>
            <FontAwesomeIcon icon={faTasks} size={24} color="black" />
          </View>          
        </TouchableOpacity>
        <TouchableOpacity>
          <View>
            <FontAwesomeIcon icon={faChild} size={24} color="black" />
          </View>          
        </TouchableOpacity>
        <TouchableOpacity>
          <View>
            <FontAwesomeIcon icon={faGift} size={24} color="black" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DashboardScreen;