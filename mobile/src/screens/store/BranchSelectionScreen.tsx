
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Branch, useStore } from '../../context/StoreProvider';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function BranchSelectionScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { setSelectedBranch, selectedSupermarket } = useStore();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    // Fallback if navigating directly or reloading
    const supermarketId = route.params?.supermarketId || selectedSupermarket?.id;

    useEffect(() => {
        if (supermarketId) {
            fetchBranches();
        }
    }, [supermarketId]);

    async function fetchBranches() {
        try {
            const { data, error } = await supabase
                .from('branches')
                .select('*')
                .eq('supermarket_id', supermarketId);

            if (error) throw error;
            setBranches(data || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderItem = ({ item }: { item: Branch }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                setSelectedBranch(item);
                // RootNavigator should automatically switch stacks, but we can't rely on it instantaneously inside the stack?
                // Actually, RootNavigator listens to the state. So updating state is enough.
            }}
        >
            <Text style={styles.name}>{item.name}</Text>
            {item.address && <Text style={styles.address}>{item.address}</Text>}
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backText}>← Change Supermarket</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Select Branch</Text>
            <FlatList
                data={branches}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
            />
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        marginBottom: 20
    },
    backText: {
        color: '#007AFF',
        fontSize: 16
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    address: {
        fontSize: 14,
        color: '#666'
    }
});
