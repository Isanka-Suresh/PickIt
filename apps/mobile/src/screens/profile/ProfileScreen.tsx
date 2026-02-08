
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '../../context/AuthProvider';
import { useStore } from '../../context/StoreProvider';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
    const { user } = useAuth();
    const { selectedSupermarket, selectedBranch, setSelectedBranch } = useStore();

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', error.message);
    };

    const handleChangeStore = () => {
        Alert.alert(
            'Change Store',
            'Are you sure you want to change the store? Your cart may be cleared.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Change',
                    style: 'destructive',
                    onPress: () => setSelectedBranch(null) // This triggers the root navigator to switch stack
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.role}>Customer</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Store</Text>
                <View style={styles.storeCard}>
                    <Text style={styles.storeName}>{selectedSupermarket?.name}</Text>
                    <Text style={styles.branchName}>{selectedBranch?.name}</Text>
                    <TouchableOpacity style={styles.changeBtn} onPress={handleChangeStore}>
                        <Text style={styles.changeBtnText}>Change</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                    <Text style={[styles.menuText, { color: '#FF3B30' }]}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>Version 1.0.0</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#007AFF',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold'
    },
    email: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
    },
    role: {
        fontSize: 14,
        color: '#666',
        marginTop: 5
    },
    section: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    storeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    storeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    branchName: {
        fontSize: 14,
        color: '#666'
    },
    changeBtn: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20
    },
    changeBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333'
    },
    menuItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500'
    },
    version: {
        textAlign: 'center',
        color: '#ccc',
        marginTop: 20,
        fontSize: 12
    }
});
