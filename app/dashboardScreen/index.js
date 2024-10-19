import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faTasks, faChild, faGift } from '@fortawesome/free-solid-svg-icons'; // Import specific icons

// Styles for the component
const styles = {
  container: {
    flex: 1, // Full height of the screen
    backgroundColor: '#F4F4F4', // Light grey background
  },
  header: {
    padding: 16, // Padding around the header
    backgroundColor: '#A8D5BA', // Header background color
    flexDirection: 'row', // Arrange header elements in a row
    justifyContent: 'space-between', // Space between header elements
    alignItems: 'center', // Center elements vertically
  },
  title: {
    fontSize: 24, // Font size for the title
    fontWeight: 'bold', // Bold title font
    paddingHorizontal: 16, // Padding around the title
    paddingTop: 16, // Padding above the title
  },
  kidTabs: {
    flexDirection: 'row', // Arrange kid tabs in a row
    marginVertical: 16, // Vertical spacing for tabs
    paddingHorizontal: 16, // Padding around the title
  },
  graphSection: {
    marginVertical: 10, // Vertical spacing for the graph section
    paddingHorizontal: 16, // Padding around the title
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
  // Sample data for recent tasks
  const recentTasks = [
    { id: '1', date: '10/18/24', taskName: 'Task 1', taskStatus: 'Completed', rewardAMT: '5', childID: '1'},
    { id: '2', date: '10/19/24', taskName: 'Task 2', taskStatus: 'Completed', rewardAMT: '5', childID: '1'},
  ];

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
        <TouchableOpacity style={{ padding: 10, borderBottomWidth: 2, borderBottomColor: '#000' }}>
          <Text>Kid 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 10 }}>
          <Text>Kid 2</Text>
        </TouchableOpacity>
      </View>

      {/* Section displaying tasks completed this week */}
      <View style={styles.graphSection}>
        <Text style={{ fontSize: 20 }}>This week</Text>
        <Text style={{ fontSize: 40, fontWeight: 'bold' }}>1 Tasks</Text>
        {/* Placeholder for bar graph visualization */}
        <View style={{ height: 150, backgroundColor: '#E0E0E0', borderRadius: 10 }} />
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