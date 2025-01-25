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
} from 'react-native'
import { FIREBASE_AUTH, FIREBASE_DB as FIRESTORE_DB } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, addDoc, collection, } from 'firebase/firestore';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import uuid from 'react-native-uuid';

interface Parent {
    docId: string;
    parentId: string;
    userUID: string;
    email: string;
}

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
    const auth = FIREBASE_AUTH;
    const [parents, setParents] = useState<Parent[]>([]);

    // Function to create a parent collection in Firestore
    const createParentAccount = async (uid: string, email: string) => {
        try {
            const parentId = uuid.v4() // Generate unique ID
            const newParent = {
                parentId: parentId,
                userUID: uid,
                email: email,
                createdAt: new Date(),
            };
            const docRef = await addDoc(collection(FIRESTORE_DB, 'Parents'), newParent);
            setParents((prevParents) => [...prevParents, { ...newParent, docId: docRef.id }]);
            console.log("New Parent added with ID: ", docRef.id);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    }

    // Function to handle sign up
	const signUp = async () => {
		setLoading(true);
		try {
			const userCredential = await createUserWithEmailAndPassword(auth(), email, password);
            const uid = userCredential.user.uid;
            await createParentAccount(uid, email);
			alert('Account created successfully!');
		} catch (e: any) {
			const err = e as FirebaseError;
			alert('Registration failed: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

    // Function to handle sign in
	const signIn = async () => {
		setLoading(true);
		try {
			await signInWithEmailAndPassword(auth(), email, password);
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
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading Tasks...</Text>
        </View>
        );
    }

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
                    />
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="Password"
                    />
                    
                    {/* Sign In Button */}
                    <Pressable
                        style={[styles.buttonContainer]}
                        onPress={signIn}
                    >
                        <Text style={{ color: '#000' }}>Login</Text>
                    </Pressable>

                    {/* Sign Up Button*/}
                    <Pressable
                        style={[styles.buttonContainer]}
                        onPress={signUp}
                    >
                        <Text style={{ color: '#000' }}>Create account</Text>
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
		justifyContent: 'center'
	},
	input: {
		marginVertical: 4,
		height: 50,
		borderWidth: 1,
		borderRadius: 4,
		padding: 10,
		backgroundColor: '#fff'
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
        alignSelf: 'center'
    } 
});

export default Login