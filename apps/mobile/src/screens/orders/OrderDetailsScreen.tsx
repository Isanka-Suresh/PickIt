
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Product } from '../../context/CartProvider';

type OrderItem = {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    products?: Product; // If joined
};

type OrderDetail = {
    id: string;
    status: string;
    created_at: string;
    pickup_time: string;
    total_amount: number;
    branch_id: string;
};

const STEPS = ['created', 'assigned', 'processing', 'ready', 'completed'];

export default function OrderDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { orderId } = route.params;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();

        // Subscribe to real-time updates for this order
        const subscription = supabase
            .channel(`order-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    console.log('Realtime update:', payload);
                    setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            // Fetch order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (orderError) throw orderError;
            setOrder(orderData);

            // Fetch items (simulated join if not configured)
            // ideally: .select('*, products(*)')
            // but for safety let's fetch items then products or assume basic data
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                    id, 
                    quantity, 
                    unit_price, 
                    product_id,
                    products (name)
                 `)
                .eq('order_id', orderId);

            if (itemsError) throw itemsError;
            setItems(itemsData || []);

        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderTimeline = () => {
        if (!order) return null;

        const currentStepIndex = STEPS.indexOf(order.status);

        return (
            <View style={styles.timelineContainer}>
                {STEPS.map((step, index) => {
                    const isActive = index <= currentStepIndex;
                    return (
                        <View key={step} style={styles.stepWrapper}>
                            <View style={[styles.stepDot, isActive && styles.activeDot]} />
                            <Text style={[styles.stepLabel, isActive && styles.activeLabel]}>
                                {step.charAt(0).toUpperCase() + step.slice(1)}
                            </Text>
                            {index < STEPS.length - 1 && (
                                <View style={[styles.connector, index < currentStepIndex && styles.activeConnector]} />
                            )}
                        </View>
                    );
                })}
            </View>
        );
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    if (!order) {
        return <View style={styles.center}><Text>Order not found</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backText}>← Back to My Orders</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Order #{order.id.slice(0, 8)}</Text>

            <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Status</Text>
                {renderTimeline()}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pickup Details</Text>
                <Text style={styles.infoText}>Time: {new Date(order.pickup_time).toLocaleString()}</Text>
                <Text style={styles.infoText}>Branch ID: {order.branch_id}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>
                {items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemName}>
                            {/*@ts-ignore*/}
                            {item.products?.name || 'Product'} x{item.quantity}
                        </Text>
                        <Text style={styles.itemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</Text>
                    </View>
                ))}
                <View style={[styles.itemRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
                </View>
            </View>
        </ScrollView>
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333'
    },
    section: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statusSection: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333'
    },
    infoText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5
    },
    timelineContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10
    },
    stepWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ddd',
        marginBottom: 5,
        zIndex: 1
    },
    activeDot: {
        backgroundColor: '#34C759',
    },
    connector: {
        position: 'absolute',
        top: 6,
        left: '50%',
        width: '100%',
        height: 2,
        backgroundColor: '#ddd',
        zIndex: 0
    },
    activeConnector: {
        backgroundColor: '#34C759'
    },
    stepLabel: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center'
    },
    activeLabel: {
        color: '#333',
        fontWeight: 'bold'
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    itemName: {
        fontSize: 16,
        color: '#333'
    },
    itemPrice: {
        fontSize: 16,
        color: '#666'
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
        marginTop: 5
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF'
    }
});
