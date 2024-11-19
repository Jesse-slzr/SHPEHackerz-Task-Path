import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ColorBlindness = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Color Blindness Test</Text>
            <Text style={styles.description}>
                This is a simple page to test for color blindness.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default ColorBlindness;