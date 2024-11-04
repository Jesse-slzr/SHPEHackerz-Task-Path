import { ImageBackground,View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, Button, KeyboardAvoidingView } from 'react-native'
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
    const auth = FIREBASE_AUTH;

	const signUp = async () => {
		setLoading(true);
		try {
			await createUserWithEmailAndPassword(auth, email, password);
			alert('Check your emails!');
		} catch (e: any) {
			const err = e as FirebaseError;
			alert('Registration failed: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

	const signIn = async () => {
		setLoading(true);
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (e: any) {
			const err = e as FirebaseError;
			alert('Sign in failed: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
        <ImageBackground
            source={require('@/assets/images/app-background.png')}
            resizeMode="cover"
            style={styles.backgroundImage}
        >
            <View style={styles.container}>
                <KeyboardAvoidingView behavior="padding">
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
                    {loading ? (
                        <ActivityIndicator size={'small'} style={{ margin: 28 }} />
                    ) : (
                        <>
                            <View style={styles.buttonContainer}>
                                <Button onPress={signIn} title="Login" />
                            </View>
                            <View style={styles.buttonContainer}>
                                <Button onPress={signUp} title="Create account" />
                            </View>
                            
                        </>
                    )}
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
	);
}

export default Login

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
	container: {
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
    buttonContainer: {
        marginVertical: 10,
    } 
});