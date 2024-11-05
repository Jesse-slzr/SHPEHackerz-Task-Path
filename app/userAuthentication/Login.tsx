import { View, Text, StyleSheet, ActivityIndicator, Button, KeyboardAvoidingView } from 'react-native'
import React, { useState } from 'react'
import { FIREBASE_AUTH } from '@/FirebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { TextInput, GestureHandlerRootView } from 'react-native-gesture-handler';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;


const signIn = async () => {
  setLoading(true);
  try {
    const response: any = await signInWithEmailAndPassword(auth, email, password);
    console.log(response); 
    alert('Check your emails!');
  } catch (error: any) {
    console.error(error);
    alert('Sign in failed: ' + error.message);
  } finally {
    setLoading(false);
  }
}

const signUp = async () => {
  setLoading(true);
  try {
    const response = await createUserWithEmailAndPassword(auth, email, password);
    console.log(response); 
    alert('Check your emails!');
  } catch (error: any) {
    console.error(error);
    alert('Sign up failed: ' + error.message);
  } finally {
    setLoading(false);
  }
}

return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <KeyboardAvoidingView behavior='padding'>

                <TextInput value={email} style={styles.input} placeholder="Email" 
                autoCapitalize="none" onChangeText={(text) => setEmail(text)} />

                <TextInput secureTextEntry={true} value={password} style={styles.input} placeholder="Password" 
                autoCapitalize='none' onChangeText={(text) => setPassword(text)}/>

                { loading ? ( 
                    <ActivityIndicator size="large" color="#fffff" />
                ) : (
                    <>
                    <View style={styles.buttonContainer}>
                        <Button title="Login" onPress={signIn} />
                    </View>
                    <View style={styles.buttonContainer}>
                    <Button title="Create Account" onPress={signUp} />
                    </View>
                    </>
                )}
                </KeyboardAvoidingView>
            </View>
        </GestureHandlerRootView>
    );
};

export default Login

const styles = StyleSheet.create({
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
  },
});

