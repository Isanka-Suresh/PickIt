
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    TouchableOpacity, Platform, SafeAreaView
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';

type OrderStatus = 'received' | 'preparing' | 'done' | 'collected';

const STEPS: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'received', label: 'Received', icon: '📥' },
    { key: 'preparing', label: 'Preparing', icon: '🧺' },
    { key: 'done', label: 'Done', icon: '✅' },
    { key: 'collected', label: 'Collected', icon: '🛍️' },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
    received: '#4F8EF7',
    preparing: '#FF9500',
    done: '#5AC8FA',
    collected: '#34C759',
};

type OrderItem = {
    id: string;
    quantity: number;
    products?: { name: string; price: number } | null;
};

type OrderDetail = {
    id: string;
    status: OrderStatus;
    created_at: string;
    scheduled_time: string | null;
    branches?: { name: string } | null;
};

export default function OrderDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { orderId } = route.params;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();

        const sub = supabase
            .channel(`order-detail-${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}`
            }, (payload) => {
                setOrder(prev => prev ? { ...prev, ...payload.new } as OrderDetail : null);
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, branches(name), order_items(id, quantity, products(name, price))')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            const d = data as any;
            setOrder(d as OrderDetail);
            setItems(d.order_items || []);
        } catch (err) {
            console.error('Error fetching order details:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#4F8EF7" /></View>;
    }
    if (!order) {
        return <View style={styles.center}><Text style={{ color: '#666' }}>Order not found</Text></View>;
    }

    const currentIndex = STEPS.findIndex(s => s.key === order.status);
    const cfg = STATUS_COLORS[order.status] || '#999';
    const total = items.reduce((acc, i) => acc + ((i.products?.price || 0) * i.quantity), 0);

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.subtitle}>
                            {new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
                        </Text>
                    </View>
                </View>

                {/* Status Card */}
                <View style={[styles.statusCard, { borderLeftColor: cfg }]}>
                    <Text style={styles.statusLabel}>Current Status</Text>
                    <Text style={[styles.statusValue, { color: cfg }]}>
                        {STEPS[currentIndex]?.icon} {STEPS[currentIndex]?.label}
                    </Text>
                </View>

                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Progress</Text>
                    {STEPS.map((step, index) => {
                        const isDone = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isPending = index > currentIndex;
                        const lineColor = index < currentIndex ? cfg : '#E5E5EA';
                        return (
                            <View key={step.key} style={styles.timelineRow}>
                                {/* Left: dot + line */}
                                <View style={styles.timelineLeft}>
                                    <View style={[
                                        styles.dot,
                                        isCurrent && { backgroundColor: cfg, borderWidth: 3, borderColor: cfg + '40' },
                                        isDone && { backgroundColor: cfg },
                                        isPending && { backgroundColor: '#E5E5EA' },
                                    ]}>
                                        {isDone && <Text style={styles.dotCheck}>✓</Text>}
                                        {isCurrent && <Text style={styles.dotCheck}>{step.icon}</Text>}
                                    </View>
                                    {index < STEPS.length - 1 && (
                                        <View style={[styles.line, { backgroundColor: lineColor }]} />
                                    )}
                                </View>
                                {/* Right: label */}
                                <View style={styles.timelineContent}>
                                    <Text style={[
                                        styles.stepLabel,
                                        isCurrent && { color: cfg, fontWeight: '700' },
                                        (isDone || isPending) && { color: isDone ? '#333' : '#aaa' },
                                    ]}>
                                        {step.label}
                                    </Text>
                                    {isCurrent && <Text style={[styles.stepSub, { color: cfg }]}>Current status</Text>}
                                    {isDone && <Text style={styles.stepSub}>Completed</Text>}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Pickup Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pickup Details</Text>
                    {order.branches && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>📍</Text>
                            <Text style={styles.infoText}>{order.branches.name}</Text>
                        </View>
                    )}
                    {order.scheduled_time && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>🕐</Text>
                            <Text style={styles.infoText}>
                                {new Date(order.scheduled_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {items.map(item => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                                <View style={styles.qtyBadge}>
                                    <Text style={styles.qtyText}>{item.quantity}×</Text>
                                </View>
                                <Text style={styles.itemName}>{item.products?.name || 'Product'}</Text>
                            </View>
                            <Text style={styles.itemPrice}>${((item.products?.price || 0) * item.quantity).toFixed(2)}</Text>
                        </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f4ff' },
    container: { flex: 1, paddingHorizontal: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40, height: 40, backgroundColor: '#fff', borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    backText: { fontSize: 20, color: '#333', fontWeight: '600' },
    title: { fontSize: 19, fontWeight: '800', color: '#1a1a2e' },
    subtitle: { fontSize: 13, color: '#888', marginTop: 2 },

    statusCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 18,
        borderLeftWidth: 4, marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    statusLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
    statusValue: { fontSize: 22, fontWeight: '800' },

    section: {
        backgroundColor: '#fff', borderRadius: 16, padding: 18,
        marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },

    timelineRow: { flexDirection: 'row', marginBottom: 0 },
    timelineLeft: { alignItems: 'center', width: 36 },
    dot: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    dotCheck: { fontSize: 11, color: '#fff', fontWeight: '700' },
    line: { width: 2, flex: 1, minHeight: 24, marginVertical: 2 },
    timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
    stepLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
    stepSub: { fontSize: 12, color: '#aaa', marginTop: 2 },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    infoIcon: { fontSize: 16 },
    infoText: { fontSize: 15, color: '#444', flex: 1 },

    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    qtyBadge: {
        backgroundColor: '#f0f4ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
        minWidth: 34, alignItems: 'center',
    },
    qtyText: { fontSize: 12, fontWeight: '700', color: '#4F8EF7' },
    itemName: { fontSize: 14, color: '#333', flex: 1 },
    itemPrice: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#4F8EF7' },
});
