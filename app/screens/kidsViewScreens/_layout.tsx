import { Tabs } from "expo-router"

export default () => {
    return (
        <Tabs>
            <Tabs.Screen name="[id]" options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
            <Tabs.Screen name="index"  options={{ headerShown: false, tabBarStyle: { display: 'none' } }}/>
        </Tabs>
    )
}
