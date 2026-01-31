
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useCart } from '../../context/CartProvider';
import { useStore } from '../../context/StoreProvider';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function CheckoutScreen() {
    const navigation = useNavigation<any>();
    const { items, totalPrice, clearCart } = useCart();
    const { selectedBranch } = useStore();
    const { user } = useAuth();

    const [submitting, setSubmitting] = useState(false);

    // Simple Date/Time Selection State
    const [selectedDay, setSelectedDay] = useState<'Today' | 'Tomorrow'>('Today');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

    const timeSlots = [
        '09:00 AM - 11:00 AM',
        '11:00 AM - 01:00 PM',
        '02:00 PM - 04:00 PM',
        '04:00 PM - 06:00 PM',
        '06:00 PM - 08:00 PM'
    ];

    const calculatePickupTime = () => {
        if (!selectedTimeSlot) return null;

        const now = new Date();
        if (selectedDay === 'Tomorrow') {
            now.setDate(now.getDate() + 1);
        }

        // This is a naive parsing for the demo
        // In reality, use a proper library like date-fns
        const startTime = selectedTimeSlot.split(' - ')[0]; // e.g., "09:00 AM"
        const finalDateStr = `${now.toDateString()} ${startTime}`;
        return new Date(finalDateStr).toISOString();
    };

    const handleSubmitOrder = async () => {
        if (!selectedTimeSlot) {
            Alert.alert('Required', 'Please select a pickup time.');
            return;
        }

        setSubmitting(true);

        try {
            const pickupTime = calculatePickupTime();

            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user?.id,
                    branch_id: selectedBranch?.id,
                    total_amount: totalPrice,
                    status: 'created',
                    pickup_time: pickupTime,
                })
                .select()
                .single();

            if (orderError) throw orderError;
            if (!orderData) throw new Error('Failed to create order');

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Success
            clearCart();
            navigation.reset({
                index: 0,
                routes: [{ name: 'OrderSuccess' }],
            });

        } catch (error: any) {
            console.error('Checkout Error:', error);
            Alert.alert('Order Failed', error.message || 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.title}>Checkout</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Pickup Day</Text>
                <View style={styles.row}>
                    {['Today', 'Tomorrow'].map((day) => (
                        <TouchableOpacity
                            key={day}
                            style={[styles.chip, selectedDay === day && styles.selectedChip]}
                            onPress={() => setSelectedDay(day as 'Today' | 'Tomorrow')}
                        >
                            <Text style={[styles.chipText, selectedDay === day && styles.selectedChipText]}>
                                {day}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Pickup Time Slot</Text>
                <View style={styles.grid}>
                    {timeSlots.map((slot) => (
                        <TouchableOpacity
                            key={slot}
                            style={[styles.slot, selectedTimeSlot === slot && styles.selectedSlot]}
                            onPress={() => setSelectedTimeSlot(slot)}
                        >
                            <Text style={[styles.slotText, selectedTimeSlot === slot && styles.selectedSlotText]}>
                                {slot}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Order Summary</Text>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryText}>Items: {items.reduce((acc, i) => acc + i.quantity, 0)}</Text>
                    <Text style={styles.summaryTotal}>Total: ${totalPrice.toFixed(2)}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.confirmBtn, submitting && styles.disabledBtn]}
                onPress={handleSubmitOrder}
                disabled={submitting}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.confirmText}>Confirm Order</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333'
    },
    section: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#555'
    },
    row: {
        flexDirection: 'row',
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 10
    },
    selectedChip: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF'
    },
    chipText: {
        color: '#333',
        fontWeight: '600'
    },
    selectedChipText: {
        color: '#fff'
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    slot: {
        width: '48%',
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        marginBottom: 5
    },
    selectedSlot: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF'
    },
    slotText: {
        color: '#333',
        fontSize: 12
    },
    selectedSlotText: {
        color: '#fff',
        fontWeight: '600'
    },
    summaryBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    summaryText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5
    },
    summaryTotal: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5
    },
    confirmBtn: {
        backgroundColor: '#34C759',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledBtn: {
        backgroundColor: '#9cd9a9'
    },
    confirmText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
