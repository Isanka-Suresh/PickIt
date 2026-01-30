
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Supermarket, useStore } from '../../context/StoreProvider';
import { useNavigation } from '@react-navigation/native';

export default function SupermarketSelectionScreen() {
    const navigation = useNavigation<any>();
    const { setSelectedSupermarket } = useStore();
    const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSupermarkets();
    }, []);

    async function fetchSupermarkets() {
        try {
            const { data, error } = await supabase.from('supermarkets').select('*');
            if (error) throw error;
            setSupermarkets(data || []);
        } catch (error) {
            console.error('Error fetching supermarkets:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderItem = ({ item }: { item: Supermarket }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                setSelectedSupermarket(item);
                navigation.navigate('BranchSelection', { supermarketId: item.id });
            }}
        >
            {item.logo_url && (
                <Image source={{ uri: item.logo_url }} style={styles.logo} resizeMode="contain" />
            )}
            <Text style={styles.name}>{item.name}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Supermarket</Text>
            <FlatList
                data={supermarkets}
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
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 15
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
});
