
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function OrderSuccessScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const orderId = route.params?.orderId as string | undefined;

    const goToOrders = () => {
        navigation.navigate('Orders', { screen: 'MyOrders' });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                {/* Success Icon */}
                <View style={styles.iconWrap}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconEmoji}>🎉</Text>
                    </View>
                    <View style={styles.checkBadge}>
                        <Text style={styles.checkText}>✓</Text>
                    </View>
                </View>

                <Text style={styles.heading}>Order Placed!</Text>
                <Text style={styles.subheading}>
                    Your order has been received. You'll get notified as it's prepared.
                </Text>

                {orderId && (
                    <View style={styles.orderIdBox}>
                        <Text style={styles.orderIdLabel}>Order ID</Text>
                        <Text style={styles.orderIdValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>
                    </View>
                )}

                <View style={styles.stepsCard}>
                    {[
                        { icon: '📥', label: 'Order Received', desc: 'We got your order' },
                        { icon: '🧺', label: 'Preparing', desc: 'Staff are getting items' },
                        { icon: '✅', label: 'Done', desc: 'Ready for pickup' },
                        { icon: '🛍️', label: 'Collect', desc: 'Pick up at the counter' },
                    ].map((step, i) => (
                        <View key={i} style={styles.step}>
                            <Text style={styles.stepIcon}>{step.icon}</Text>
                            <View style={styles.stepInfo}>
                                <Text style={styles.stepLabel}>{step.label}</Text>
                                <Text style={styles.stepDesc}>{step.desc}</Text>
                            </View>
                            {i === 0 && <View style={styles.activeDot} />}
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.trackBtn} onPress={goToOrders}>
                    <Text style={styles.trackBtnText}>Track My Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.shopBtn}
                    onPress={() => navigation.navigate('Shop', { screen: 'ProductList' })}
                >
                    <Text style={styles.shopBtnText}>Continue Shopping</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f4ff' },
    container: {
        flex: 1, alignItems: 'center', paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 60 : 30,
    },

    iconWrap: { position: 'relative', marginBottom: 24 },
    iconCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#EBF1FF', alignItems: 'center', justifyContent: 'center',
    },
    iconEmoji: { fontSize: 46 },
    checkBadge: {
        position: 'absolute', bottom: 0, right: -4,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#f0f4ff',
    },
    checkText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    heading: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginBottom: 10 },
    subheading: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },

    orderIdBox: {
        backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
        alignItems: 'center', marginBottom: 24,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    orderIdLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
    orderIdValue: { fontSize: 18, fontWeight: '800', color: '#4F8EF7', letterSpacing: 1 },

    stepsCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', marginBottom: 28,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    step: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    stepIcon: { fontSize: 22, marginRight: 12, width: 28, textAlign: 'center' },
    stepInfo: { flex: 1 },
    stepLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
    stepDesc: { fontSize: 12, color: '#999', marginTop: 1 },
    activeDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759',
    },

    trackBtn: {
        backgroundColor: '#4F8EF7', borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', width: '100%', marginBottom: 12,
        shadowColor: '#4F8EF7', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
    },
    trackBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    shopBtn: {
        backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
        alignItems: 'center', width: '100%',
        borderWidth: 1.5, borderColor: '#e0e7ff',
    },
    shopBtnText: { color: '#4F8EF7', fontWeight: '700', fontSize: 15 },
});
