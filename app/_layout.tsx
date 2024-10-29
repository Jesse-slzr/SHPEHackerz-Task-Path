import { Stack } from "expo-router"

const StackLayout = () => {
    return(
        <Stack>
            <Stack.Screen name="dashboardScreens" options={{ headerShown: true }} />
            <Stack.Screen name="userAuthentication" options={{ headerShown: true }} />
        </Stack>
    )
}

export default StackLayout;