
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { useStore } from '../../context/StoreProvider';

export default function HomeScreen() {
    const { user } = useAuth();
    const { selectedBranch, selectedSupermarket, setSelectedBranch } = useStore();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>PickIt</Text>
            <Text style={styles.store}>{selectedSupermarket?.name} - {selectedBranch?.name}</Text>
            <Text style={styles.subtitle}>Welcome, {user?.email}</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => setSelectedBranch(null)} // Reset branch to change store
            >
                <Text style={styles.buttonText}>Change Store</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={() => {
                    setSelectedBranch(null); // Clear store on logout? Optional.
                    supabase.auth.signOut();
                }}
            >
                <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    store: {
        fontSize: 20,
        fontWeight: '600',
        color: '#007AFF', // Brand color
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 10,
        width: '80%',
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
