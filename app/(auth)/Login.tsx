import { 
    ImageBackground,
    Image,
    View,
    KeyboardAvoidingView,
    ActivityIndicator,
    TextInput,
    Pressable,
    Text,
    StyleSheet,
    Switch
} from 'react-native'
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'expo-router';
import { updateUserTypeToKid, updateUserTypeToParent } from "../../utils/firebaseUtils";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
    const [isParent, setIsParent] = useState(true); 
	const [loading, setLoading] = useState(false);
    const auth = FIREBASE_AUTH;
    const router = useRouter(); 

    // Function to handle sign in
	const signIn = async () => {
		setLoading(true);
		try {
			await signInWithEmailAndPassword(auth(), email, password);
            if (isParent) {
                router.replace('/screens/dashboardScreens'); // Navigate to Parent Dashboard
                await updateUserTypeToParent();
            } else {
                router.replace('/screens/kidsViewScreens'); // Navigate to Kids View
                await updateUserTypeToKid();
            }
        } catch (e: any) {
			const err = e as FirebaseError;
			alert('Sign in failed: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A8D5BA" />
            <Text>Loading...</Text>
        </View>
        );
    }

	return (
        <ImageBackground
            source={require('@/assets/images/app-background.png')}
            resizeMode="cover"
            style={styles.backgroundImage}
        >
            {/* Header with Back Arrow */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push('/(auth)/LandingScreen')} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={24} color="black" />
                </Pressable>
                <Text style={styles.headerTitle}>Login</Text>
            </View>

            {/* Login form */}
            <View style={styles.container}>
                <KeyboardAvoidingView behavior="padding">       
                    {/* Inputs */}
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="Email"
                        placeholderTextColor="#666"
                    />
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="Password"
                        placeholderTextColor="#666"
                    />

                    {/* Toggle Switch for Account Type */}
                    <View style={styles.switchContainer}>
                        <Text style={[styles.switchText, !isParent && styles.highlightText]}>Kids</Text>
                        <Switch
                            value={isParent}
                            onValueChange={setIsParent}
                            thumbColor="#fff"
                        />
                        <Text style={[styles.switchText, isParent && styles.highlightText]}>Parent</Text>
                    </View>
                    
                    {/* Sign In Button */}
                    <Pressable
                        style={[styles.buttonContainer]}
                        onPress={signIn}
                    >
                        <Text style={styles.buttonText}>Login</Text>
                    </Pressable>

                    {/* Navigate to Sign Up */}
                    <Pressable
                        style={[styles.buttonContainer]}
                        onPress={() => router.push('/(auth)/SignUp')}
                    >
                        <Text style={styles.buttonText}>Go to Sign Up</Text>
                    </Pressable>
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
	);
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    header: {
        backgroundColor: '#A8D5BA',
        padding: 16,
        paddingTop: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 108,
    },
    backButton: {
        padding: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        flex: 1,
        textAlign: 'center',
        marginRight: 40,
    },
	container: {
        marginBottom: 320,
		marginHorizontal: 20,
		flex: 1,
		justifyContent: 'center'
	},
	input: {
		marginVertical: 4,
		height: 50,
		borderWidth: 1,
		borderRadius: 4,
		padding: 10,
		backgroundColor: '#fff',
        fontSize: 14,
	},
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    switchText: {
        fontSize: 16,
        marginHorizontal: 10,
    },
    highlightText: {
        fontWeight: 'bold',
        color: '#000',
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
        alignSelf: 'center'
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
    },
});

export default Login