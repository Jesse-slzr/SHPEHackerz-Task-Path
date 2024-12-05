import { Tabs } from "expo-router"

export default () => {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
            <Tabs.Screen name="KidsRewardsView" options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
        </Tabs>
    )
}
