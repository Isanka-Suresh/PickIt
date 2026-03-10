
import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { Product, useCart } from '../context/CartProvider';
import { useStore } from '../context/StoreProvider';
import { getSubstituteRecommendations } from '../../lib/ai';

type Props = {
    outOfStockProduct: Product;
};

export default function SubstituteBanner({ outOfStockProduct }: Props) {
    const { items, addToCart } = useCart();
    const { selectedBranch } = useStore();
    const [substitutes, setSubstitutes] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubstitutes();
    }, [outOfStockProduct.id]);

    async function fetchSubstitutes() {
        setLoading(true);
        try {
            // Pass all in-stock product IDs so the API can filter for available alternatives
            const allBranchIds = items
                .filter(i => i.product.stock > 0)
                .map(i => i.product.id);

            const results = await getSubstituteRecommendations(
                outOfStockProduct.id,
                allBranchIds,
                selectedBranch?.id,
                4,
            );
            setSubstitutes(results);
        } finally {
            setLoading(false);
        }
    }

    if (!loading && substitutes.length === 0) return null;

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => addToCart(item)}
            disabled={item.stock === 0}
        >
            <View style={styles.emojiBox}>
                <Text style={styles.emoji}>🔄</Text>
            </View>
            <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
            {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : null}
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <View style={[styles.addBtn, item.stock === 0 && styles.disabledBtn]}>
                <Text style={styles.addText}>{item.stock === 0 ? 'OOS' : 'Swap'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Out of stock</Text>
                    <Text style={styles.subtitle}>
                        <Text style={styles.bold}>{outOfStockProduct.name}</Text>
                        {' '}is unavailable — try these instead:
                    </Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="small" color="#FF9500" style={{ marginTop: 8 }} />
            ) : (
                <FlatList
                    horizontal
                    data={substitutes}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF8E7',
        borderRadius: 12,
        padding: 14,
        marginTop: 6,
        marginBottom: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        gap: 8,
    },
    warningIcon: {
        fontSize: 18,
        marginTop: 2,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: '#B27000',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 13,
        color: '#6D4C00',
        marginTop: 2,
        lineHeight: 18,
    },
    bold: {
        fontWeight: '700',
    },
    list: {
        paddingRight: 8,
    },
    card: {
        width: 120,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginRight: 10,
        padding: 10,
        shadowColor: '#B27000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        alignItems: 'center',
    },
    emojiBox: {
        width: 50,
        height: 50,
        backgroundColor: '#FFF3D9',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    emoji: {
        fontSize: 24,
    },
    name: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a1a1a',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 2,
    },
    brand: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
        marginBottom: 2,
    },
    price: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '700',
        marginBottom: 6,
    },
    addBtn: {
        backgroundColor: '#FF9500',
        paddingVertical: 4,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    disabledBtn: {
        backgroundColor: '#ccc',
    },
    addText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
});
