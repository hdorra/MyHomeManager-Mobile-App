import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { authInstance } from '../firebase/config';

function Login({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!email.trim()) {
            Alert.alert("Error", "Please Enter A Valid Username.");
            return;
        }

        if (!password.trim()) {
            Alert.alert("Error", "Please Enter A Valid Password.");
            return;
        }

        authInstance.signInWithEmailAndPassword(email, password)
            .then(() => {
                // Reset navigation state to ensure 'HomeList' becomes the only screen in the stack
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'HomeList' }],
                });
            })
            .catch(error => {
                Alert.alert("Invalid Username/Password. Please Try Again.");
            });
    };

    return (
        <View style={styles.container}>
            <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                style={styles.input}
            />
            <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry  // to hide the password text
                style={styles.input}
            />
            <Button title="Login" onPress={handleLogin} />
            <Text style={{ textAlign: 'center', marginTop: 15 }}>Don't have an account?</Text>
            <Button title="Register" onPress={() => navigation.navigate('Register')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 16,
    },
});

export default Login;
