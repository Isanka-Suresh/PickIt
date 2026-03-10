
import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
    Alert, ScrollView, SafeAreaView, Platform
} from 'react-native';
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
    const [selectedDay, setSelectedDay] = useState<0 | 1>(0); // 0=Today, 1=Tomorrow
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const days = ['Today', 'Tomorrow'];
    const timeSlots = [
        { id: '09-11', label: '9:00 AM – 11:00 AM', hour: 9 },
        { id: '11-13', label: '11:00 AM – 1:00 PM', hour: 11 },
        { id: '13-15', label: '1:00 PM – 3:00 PM', hour: 13 },
        { id: '15-17', label: '3:00 PM – 5:00 PM', hour: 15 },
        { id: '17-19', label: '5:00 PM – 7:00 PM', hour: 17 },
    ];

    const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

    const buildPickupTime = (): string | null => {
        const slot = timeSlots.find(s => s.id === selectedSlot);
        if (!slot) return null;
        const date = new Date();
        date.setDate(date.getDate() + selectedDay);
        date.setHours(slot.hour, 0, 0, 0);
        return date.toISOString();
    };

    const handleSubmitOrder = async () => {
        if (!selectedSlot) {
            Alert.alert('Select a Time Slot', 'Please choose a pickup time before confirming.');
            return;
        }
        if (!selectedBranch || !user) {
            Alert.alert('Error', 'Session expired. Please restart the app.');
            return;
        }

        setSubmitting(true);
        try {
            const pickupTime = buildPickupTime();

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: user.id,
                    supermarket_id: selectedBranch.supermarket_id,
                    branch_id: selectedBranch.id,
                    status: 'received',
                    scheduled_time: pickupTime,
                })
                .select()
                .single();

            if (orderError) throw orderError;
            if (!orderData) throw new Error('Failed to create order');

            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.product.id,
                quantity: item.quantity,
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            clearCart();
            navigation.reset({
                index: 0,
                routes: [{ name: 'OrderSuccess', params: { orderId: orderData.id } }],
            });
        } catch (error: any) {
            console.error('Checkout Error:', error);
            Alert.alert('Order Failed', error.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Checkout</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Branch Card */}
                <View style={styles.branchCard}>
                    <Text style={styles.branchLabel}>Pickup From</Text>
                    <Text style={styles.branchName}>{selectedBranch?.name || 'Selected Branch'}</Text>
                </View>

                {/* Cart Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {items.map(item => (
                        <View key={item.product.id} style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                                <View style={styles.qtyBadge}>
                                    <Text style={styles.qtyBadgeText}>{item.quantity}×</Text>
                                </View>
                                <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                            </View>
                            <Text style={styles.itemPrice}>${(item.product.price * item.quantity).toFixed(2)}</Text>
                        </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total ({totalItems} items)</Text>
                        <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Pickup Day */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pickup Day</Text>
                    <View style={styles.dayRow}>
                        {days.map((day, idx) => (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayChip, selectedDay === idx && styles.dayChipActive]}
                                onPress={() => { setSelectedDay(idx as 0 | 1); setSelectedSlot(null); }}
                            >
                                <Text style={[styles.dayChipText, selectedDay === idx && styles.dayChipTextActive]}>
                                    {day}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Pickup Time */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pickup Time</Text>
                    <View style={styles.slotGrid}>
                        {timeSlots.map(slot => (
                            <TouchableOpacity
                                key={slot.id}
                                style={[styles.slotChip, selectedSlot === slot.id && styles.slotChipActive]}
                                onPress={() => setSelectedSlot(slot.id)}
                            >
                                <Text style={[styles.slotText, selectedSlot === slot.id && styles.slotTextActive]}>
                                    {slot.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <View style={styles.footerSummary}>
                    <Text style={styles.footerTotal}>${totalPrice.toFixed(2)}</Text>
                    <Text style={styles.footerItems}>{totalItems} items</Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmBtn, (!selectedSlot || submitting) && styles.confirmBtnDisabled]}
                    onPress={handleSubmitOrder}
                    disabled={!selectedSlot || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.confirmText}>Confirm Order</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const PRIMARY = '#4F8EF7';
const ACCENT = '#34C759';

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f4ff' },
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40, height: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    backText: { fontSize: 20, color: '#333', fontWeight: '600' },
    title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },

    branchCard: {
        backgroundColor: PRIMARY,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    },
    branchLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
    branchName: { color: '#fff', fontSize: 18, fontWeight: '700' },

    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    sectionTitle: {
        fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 12,
    },

    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
    qtyBadge: {
        backgroundColor: '#f0f4ff', borderRadius: 8, minWidth: 32, height: 28,
        alignItems: 'center', justifyContent: 'center', marginRight: 10, paddingHorizontal: 6,
    },
    qtyBadgeText: { fontSize: 12, fontWeight: '700', color: PRIMARY },
    itemName: { fontSize: 14, color: '#333', flex: 1 },
    itemPrice: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, color: '#666', fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: '800', color: PRIMARY },

    dayRow: { flexDirection: 'row', gap: 12 },
    dayChip: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    dayChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    dayChipText: { fontSize: 14, fontWeight: '600', color: '#666' },
    dayChipTextActive: { color: '#fff' },

    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotChip: {
        width: '48%', paddingVertical: 13, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    slotChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    slotText: { fontSize: 13, color: '#666', fontWeight: '500' },
    slotTextActive: { color: '#fff', fontWeight: '700' },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1, borderTopColor: '#f0f0f0',
        flexDirection: 'row', alignItems: 'center', gap: 14,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
    },
    footerSummary: { flex: 1 },
    footerTotal: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    footerItems: { fontSize: 12, color: '#999', marginTop: 1 },
    confirmBtn: {
        flex: 2, backgroundColor: ACCENT, paddingVertical: 16,
        borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
    },
    confirmBtnDisabled: { backgroundColor: '#a8d5b5', shadowOpacity: 0 },
    confirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
