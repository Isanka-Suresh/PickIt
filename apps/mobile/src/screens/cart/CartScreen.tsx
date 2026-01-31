
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useCart, CartItem } from '../../context/CartProvider';
import { useNavigation } from '@react-navigation/native';

import RecommendationList from '../../components/RecommendationList';

export default function CartScreen() {
    const navigation = useNavigation<any>();
    const { items, updateQuantity, totalPrice, clearCart } = useCart();

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={styles.item}>
            <View style={styles.info}>
                <Text style={styles.name}>{item.product.name}</Text>
                <Text style={styles.price}>${item.product.price.toFixed(2)}</Text>
            </View>
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                    <Text>-</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock_quantity}
                >
                    <Text>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
import EmptyState from '../../components/EmptyState';

    // ... inside component

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
                    keyExtractor={(i) => i.product.id}
                    contentContainerStyle={styles.list}
                    ListFooterComponent={<RecommendationList />}
                />
            )}

            {items.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.checkoutBtn}
                        onPress={() => navigation.navigate('Checkout')}
                    >
                        <Text style={styles.checkoutText}>Proceed to Checkout</Text>
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
        marginBottom: 20
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    list: {
        paddingBottom: 100
    },
    item: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    info: {
        flex: 1
    },
    name: {
        fontSize: 16,
        fontWeight: '600'
    },
    price: {
        color: '#666'
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    qtyBtn: {
        width: 30,
        height: 30,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15
    },
    qty: {
        marginHorizontal: 10,
        fontWeight: 'bold'
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF'
    },
    checkoutBtn: {
        backgroundColor: '#34C759',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center'
    },
    checkoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});
