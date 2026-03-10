
import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    RefreshControl, Platform, SafeAreaView
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

type OrderStatus = 'received' | 'preparing' | 'done' | 'collected';

type Order = {
    id: string;
    created_at: string;
    status: OrderStatus;
    scheduled_time: string | null;
    branches?: { name: string } | null;
    order_items?: { quantity: number; products?: { price: number } | null }[] | null;
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
    received: { label: 'Received', color: '#4F8EF7', bg: '#EBF1FF', icon: '📥' },
    preparing: { label: 'Preparing', color: '#FF9500', bg: '#FFF4E8', icon: '🧺' },
    done: { label: 'Done', color: '#5AC8FA', bg: '#E8F7FF', icon: '✅' },
    collected: { label: 'Collected', color: '#34C759', bg: '#E8F9EE', icon: '🛍️' },
};

export default function MyOrdersScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            if (!user?.id) return;
            const { data, error } = await supabase
                .from('orders')
                .select('*, branches(name), order_items(quantity, products(price))')
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders((data as unknown) as Order[]);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch on focus
    useFocusEffect(useCallback(() => { fetchOrders(); }, []));

    // Real-time subscription: update status badge instantly
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`my-orders-${user.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
                (payload) => {
                    setOrders(prev =>
                        prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o)
                    );
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, []);

    const renderItem = ({ item }: { item: Order }) => {
        const total = item.order_items?.reduce((acc, curr) =>
            acc + ((curr.products?.price || 0) * curr.quantity), 0) || 0;
        const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, color: '#999', bg: '#f0f0f0', icon: '📦' };
        const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                activeOpacity={0.75}
            >
                {/* Status stripe */}
                <View style={[styles.statusStripe, { backgroundColor: cfg.color }]} />

                <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                        <View>
                            <Text style={styles.cardId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
                            <Text style={styles.cardDate}>{date}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                            <Text style={styles.badgeIcon}>{cfg.icon}</Text>
                            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>

                    <View style={styles.cardMeta}>
                        {item.branches && (
                            <Text style={styles.metaText}>📍 {item.branches.name}</Text>
                        )}
                        {item.scheduled_time && (
                            <Text style={styles.metaText}>
                                🕐 {new Date(item.scheduled_time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                            </Text>
                        )}
                    </View>

                    <View style={styles.cardFooter}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.container}>
                    <Text style={styles.pageTitle}>My Orders</Text>
                    {[1, 2, 3].map(k => (
                        <View key={k} style={[styles.card, { padding: 20 }]}>
                            <Skeleton width="60%" height={18} style={{ marginBottom: 10 }} />
                            <Skeleton width="40%" height={14} style={{ marginBottom: 16 }} />
                            <Skeleton width="30%" height={22} />
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.pageTitle}>My Orders</Text>
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F8EF7" />}
                    showsVerticalScrollIndicator={false}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f4ff' },
    container: { flex: 1, paddingTop: Platform.OS === 'android' ? 50 : 10, paddingHorizontal: 20 },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginBottom: 20 },
    list: { paddingBottom: 30 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 14,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
    },
    statusStripe: { width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
    cardBody: { flex: 1, padding: 16 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    cardId: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    cardDate: { fontSize: 12, color: '#999', marginTop: 2 },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    badgeIcon: { fontSize: 12 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    cardMeta: { marginBottom: 12, gap: 3 },
    metaText: { fontSize: 12, color: '#666' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
    totalLabel: { fontSize: 13, color: '#999' },
    totalValue: { fontSize: 17, fontWeight: '800', color: '#4F8EF7' },
});
