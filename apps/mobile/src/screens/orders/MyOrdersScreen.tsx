
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

type Order = {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    pickup_time: string;
    branch_id: string; // Ideally we fetch branch name too
};

export default function MyOrdersScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Reload when screen comes into focus to capture new orders
    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#34C759'; // Green
            case 'ready': return '#007AFF'; // Blue
            case 'processing': return '#FF9500'; // Orange
            case 'assigned': return '#AF52DE'; // Purple
            case 'cancelled': return '#FF3B30'; // Red
            default: return '#8E8E93'; // Gray for created
        }
    };

    const renderItem = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
            <View style={styles.headerRow}>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>
            <Text style={styles.amount}>Total: ${item.total_amount.toFixed(2)}</Text>
            <Text style={styles.pickup}>Pickup: {new Date(item.pickup_time).toLocaleString()}</Text>
        </TouchableOpacity>
    );

    import Skeleton from '../../components/Skeleton';
    import EmptyState from '../../components/EmptyState';

    // ... inside component

    if (loading && !refreshing) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>My Orders</Text>
                {[1, 2, 3, 4].map(key => (
                    <View key={key} style={styles.card}>
                        <View style={styles.headerRow}>
                            <Skeleton width={80} height={16} />
                            <Skeleton width={60} height={20} style={{ borderRadius: 10 }} />
                        </View>
                        <Skeleton width="40%" height={24} style={{ marginBottom: 5 }} />
                        <Skeleton width="60%" height={16} />
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Orders</Text>

            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <EmptyState
                        title="No orders yet"
                        description="Your past and current orders will appear here."
                        icon="📦"
                        actionLabel="Start Shopping"
                        onAction={() => navigation.navigate('Shop', { screen: 'ProductList' })}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
        paddingTop: 50,
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
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333'
    },
    list: {
        paddingBottom: 20,
    },
    empty: {
        marginTop: 50,
        alignItems: 'center'
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    date: {
        color: '#666',
        fontSize: 14
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold'
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5
    },
    pickup: {
        fontSize: 14,
        color: '#555'
    }
});
