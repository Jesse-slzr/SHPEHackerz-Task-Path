import { Tabs } from "expo-router"

export default () => {
    return (
        <Tabs>
            <Tabs.Screen name="index"/>
            <Tabs.Screen name="KidsManagementScreen" />
            <Tabs.Screen name="RewardsManagementScreen" />
            <Tabs.Screen name="TasksManagementScreen" />
        </Tabs>
    )
}