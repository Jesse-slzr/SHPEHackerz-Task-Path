import { ImageBackground,View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, Button, KeyboardAvoidingView, TouchableOpacity } from 'react-native'
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, RecaptchaVerifier } from 'firebase/auth';
import { signInWithPhoneNumber as firebaseSignInWithPhoneNumber } from 'firebase/auth';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { useEffect } from 'react';
// If null, no SMS has been sent
import { ConfirmationResult } from 'firebase/auth';
  

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
                            <TouchableOpacity
                                style={[styles.buttonContainer]}
                                onPress={signIn}
                            >
                                <Text style={{ color: '#000' }}>Login</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.buttonContainer]}
                                onPress={signUp}
                            >
                                <Text style={{ color: '#000' }}>Create account</Text>
                            </TouchableOpacity>
                            
                        </>
                    )}
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
	);
}

function PhoneSignIn() {
  const [confirm, setConfirm] = useState<ConfirmationResult | null>(null);
  const auth = FIREBASE_AUTH;

  // verification code (OTP - One-Time-Passcode)
  const [code, setCode] = useState('');

  // Handle login
  function onAuthStateChanged(user: any) {
    if (user) {
      // Some Android devices can automatically process the verification code (OTP) message, and the user would NOT need to enter the code.
      // Actually, if he/she tries to enter it, he/she will get an error message because the code was already used in the background.
      // In this function, make sure you hide the component(s) for entering the code and/or navigate away from this screen.
      // It is also recommended to display a message to the user informing him/her that he/she has successfully logged in.
    }
  }

  useEffect(() => {
    const subscriber = FIREBASE_AUTH.onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  async function signInWithPhoneNumber(auth: any, phoneNumber: string, appVerifier: any) {
    const confirmation = await firebaseSignInWithPhoneNumber(auth, phoneNumber, appVerifier);
    setConfirm(confirmation);
    setConfirm(confirmation);
  }

  async function confirmCode() {
    try {
      if (confirm) {
        await confirm.confirm(code);
      } else {
        console.log('Confirmation result is null.');
      }
    } catch (error) {
      console.log('Invalid code.');
    }
  }

  if (!confirm) {
    const [phoneNumber, setPhoneNumber] = useState('');

    const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {});

    return (
        <>
            <TextInput
                value={phoneNumber}
                onChangeText={text => setPhoneNumber(text)}
                placeholder="Phone Number"
                keyboardType="phone-pad"
            />
            <Button
                title="Phone Number Sign In"
                onPress={() => signInWithPhoneNumber(auth, phoneNumber, appVerifier)}
            />
            <View id="recaptcha-container" />
        </>
    );
  }

  return (
    <>
      <TextInput value={code} onChangeText={text => setCode(text)} />
      <Button title="Confirm Code" onPress={() => confirmCode()} />
    </>
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

