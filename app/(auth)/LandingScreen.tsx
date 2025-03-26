import { 
    ImageBackground,
    Image,
    View,
    Pressable,
    Text,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

const LandingScreen = () => {
    const router = useRouter();

    return (
        <ImageBackground
            source={require('@/assets/images/app-background.png')}
            resizeMode="cover"
            style={styles.backgroundImage}
        >
            {/* Title image */}
            <Image
                source={require('../../assets/images/TaskPath.png')}
                style={styles.titleImage}
            />

            {/* Buttons */}
            <View style={styles.container}>
                <Pressable
                    style={styles.buttonContainer}
                    onPress={() => router.push('/(auth)/Login')}
                >
                    <Text style={styles.buttonText}>Log In</Text>
                </Pressable>

                <Pressable
                    style={styles.buttonContainer}
                    onPress={() => router.push('/(auth)/SignUp')}
                >
                    <Text style={styles.buttonText}>Sign Up</Text>
                </Pressable>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    titleImage: {
        width: '100%',
        height: '25%',
        marginTop: 30,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    container: {
        marginBottom: 320,
        marginHorizontal: 20,
        flex: 1,
        justifyContent: 'center',
    },
    buttonContainer: {
        marginVertical: 10,
        borderRadius: 10,
        backgroundColor: '#A8D5BA',
        borderColor: '#fff',
        borderWidth: 3,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '50%',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
    },
});

export default LandingScreen;