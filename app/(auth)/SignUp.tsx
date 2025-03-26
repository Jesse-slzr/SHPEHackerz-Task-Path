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
} from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB as FIRESTORE_DB } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import uuid from 'react-native-uuid';
import { useRouter } from 'expo-router';
import { updateUserTypeToParent } from "../../utils/firebaseUtils";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

interface Parent {
    docId: string;
    parentId: string;
    userUID: string;
    email: string;
    userType: 'parent' | 'kid';
    createdAt?: Date;
    name: string;
}

const SignUp = () => {
    const [name, setName] = useState(''); // Added name state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = FIREBASE_AUTH;
    const router = useRouter(); 

    // Function to create a parent collection in Firestore
    const createParentAccount = async (uid: string, email: string, name: string) => {
        try {
            const parentId = uuid.v4() as string;
            const newParent: Omit<Parent, 'docId'> = {
                parentId: parentId,
                userUID: uid,
                email: email,
                createdAt: new Date(),
                userType: 'parent',
                name: name,
            };
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Parents'), newParent);
            console.log("New Parent added with ID: ", docRef.id);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    // Function to handle sign up
    const signUp = async () => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth(), email, password);
            const uid = userCredential.user.uid;
            await createParentAccount(uid, email, name);
            await updateUserTypeToParent();
            alert('Account created successfully!');
            router.replace('/screens/dashboardScreens');
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Registration failed: ' + err.message);
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
                <Text style={styles.headerTitle}>Sign Up</Text>
            </View>

            {/* Sign Up form */}
            <View style={styles.container}>
                <KeyboardAvoidingView behavior="padding">       
                    {/* Inputs */}
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Name"
                        placeholderTextColor="#666"
                    />
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

                    {/* Sign Up Button */}
                    <Pressable
                        style={styles.buttonContainer}
                        onPress={signUp}
                    >
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </Pressable>

                    {/* Navigate to Login */}
                    <Pressable
                        style={styles.buttonContainer} // UPDATED TO MATCH LOGIN BUTTON STYLE
                        onPress={() => router.push('/(auth)/Login')}
                    >
                        <Text style={styles.buttonText}>Go to Login</Text>
                    </Pressable>
                </KeyboardAvoidingView>
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
        justifyContent: 'center',
    },
    input: {
        marginVertical: 4,
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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

export default SignUp;