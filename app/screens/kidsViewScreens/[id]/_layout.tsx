import { Tabs } from "expo-router"

export default () => {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ headerShown: false }}/>
            <Tabs.Screen name="KidsRewardsView" options={{ headerShown: false }}/>
        </Tabs>
    )
}
