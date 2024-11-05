import { Tabs } from "expo-router"

export default () => {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: 'Main Dashboard' }}/>
            <Tabs.Screen name="KidsManagementScreen" />
            <Tabs.Screen name="RewardsManagementScreen" />
            <Tabs.Screen name="TasksManagementScreen" />
        </Tabs>
    )
}