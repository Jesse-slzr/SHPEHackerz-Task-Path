import { Tabs } from "expo-router"

export default () => {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
            <Tabs.Screen name="KidsManagementScreen" options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
            <Tabs.Screen name="RewardsManagementScreen" options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
            <Tabs.Screen name="TasksManagementScreen" options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
            <Tabs.Screen name="report" options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
        </Tabs>
    )
}