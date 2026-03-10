
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart, CartItem } from '../../context/CartProvider';
import { useNavigation } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import RecommendationList from '../../components/RecommendationList';
import SubstituteBanner from '../../components/SubstituteBanner';

export default function CartScreen() {
    const navigation = useNavigation<any>();
    const { items, updateQuantity, totalPrice } = useCart();

    // Items that are out-of-stock (added earlier, stock changed)
    const outOfStockItems = items.filter(i => i.product.stock === 0);

    const renderItem = ({ item }: { item: CartItem }) => (
        <View>
            <View style={[styles.item, item.product.stock === 0 && styles.oosItem]}>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.product.name}</Text>
                    <Text style={styles.price}>${item.product.price.toFixed(2)}</Text>
                    {item.product.stock === 0 && (
                        <Text style={styles.oosLabel}>⚠️ Out of stock</Text>
                    )}
                </View>
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                        <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={[styles.qtyBtn, item.quantity >= item.product.stock && styles.qtyBtnDisabled]}
                        onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                    >
                        <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Substitute suggestions when this specific item is OOS */}
            {item.product.stock === 0 && (
                <SubstituteBanner outOfStockProduct={item.product} />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Cart</Text>

            {items.length === 0 ? (
                <EmptyState
                    title="Your cart is empty"
                    description="Looks like you haven't added anything yet."
                    icon="🛒"
                    actionLabel="Start Shopping"
                    onAction={() => navigation.navigate('Shop', { screen: 'ProductList' })}
                />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={i => i.product.id}
                    contentContainerStyle={styles.list}
                    ListFooterComponent={<RecommendationList />}
                />
            )}

            {items.length > 0 && (
                <View style={styles.footer}>
                    {outOfStockItems.length > 0 && (
                        <View style={styles.oosWarning}>
                            <Text style={styles.oosWarningText}>
                                ⚠️ {outOfStockItems.length} item{outOfStockItems.length > 1 ? 's' : ''} in your cart {outOfStockItems.length > 1 ? 'are' : 'is'} out of stock
                            </Text>
                        </View>
                    )}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.checkoutBtn, outOfStockItems.length > 0 && styles.checkoutBtnWarning]}
                        onPress={() => navigation.navigate('Checkout')}
                    >
                        <Text style={styles.checkoutText}>
                            {outOfStockItems.length > 0 ? 'Checkout (review OOS items)' : 'Proceed to Checkout'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1a1a1a',
    },
    list: {
        paddingBottom: 160,
    },
    item: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    oosItem: {
        borderWidth: 1,
        borderColor: '#FFD580',
        backgroundColor: '#FFFDF5',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    price: {
        color: '#007AFF',
        fontWeight: '600',
        marginTop: 2,
    },
    oosLabel: {
        color: '#FF9500',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    qtyBtn: {
        width: 32,
        height: 32,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    qtyBtnDisabled: {
        backgroundColor: '#e8e8e8',
    },
    qtyBtnText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
        lineHeight: 22,
    },
    qty: {
        marginHorizontal: 12,
        fontWeight: '700',
        fontSize: 16,
        color: '#1a1a1a',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 8,
    },
    oosWarning: {
        backgroundColor: '#FFF3D9',
        borderRadius: 8,
        padding: 8,
        marginBottom: 10,
    },
    oosWarningText: {
        color: '#B27000',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    checkoutBtn: {
        backgroundColor: '#34C759',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkoutBtnWarning: {
        backgroundColor: '#FF9500',
    },
    checkoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
