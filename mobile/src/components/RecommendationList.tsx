
import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { Product, useCart } from '../context/CartProvider';
import { useStore } from '../context/StoreProvider';
import { getComboRecommendationsWithMeta } from '../../lib/ai';

type RecommendedItem = { product: Product; reason: string };

export default function RecommendationList() {
    const { items, addToCart } = useCart();
    const { selectedBranch } = useStore();
    const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Debounce — wait until user stops adding items rapidly
        const timer = setTimeout(fetchRecommendations, 1000);
        return () => clearTimeout(timer);
    }, [items.length]);

    async function fetchRecommendations() {
        if (items.length === 0) {
            setRecommendations([]);
            return;
        }
        setLoading(true);
        try {
            const cartIds = items.map(i => i.product.id);
            const recs = await getComboRecommendationsWithMeta(cartIds, selectedBranch?.id, 6);
            // Filter out items already in cart
            const filtered = recs.filter(r => !items.find(i => i.product.id === r.product.id));
            setRecommendations(filtered);
        } finally {
            setLoading(false);
        }
    }

    if (recommendations.length === 0 && !loading) return null;

    const renderItem = ({ item }: { item: RecommendedItem }) => (
        <View style={styles.card}>
            <View style={styles.emojiPlaceholder}>
                <Text style={styles.emoji}>🛒</Text>
            </View>
            <View style={styles.info}>
                <Text numberOfLines={2} style={styles.name}>{item.product.name}</Text>
                <Text numberOfLines={1} style={styles.reason}>{item.reason}</Text>
                <Text style={styles.price}>${item.product.price.toFixed(2)}</Text>
                <TouchableOpacity
                    style={[styles.addBtn, item.product.stock === 0 && styles.disabledBtn]}
                    disabled={item.product.stock === 0}
                    onPress={() => {
                        addToCart(item.product);
                        setRecommendations(prev => prev.filter(r => r.product.id !== item.product.id));
                    }}
                >
                    <Text style={styles.addText}>
                        {item.product.stock === 0 ? 'Out of stock' : 'Add'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🤖 You might also like</Text>
                {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />}
            </View>
            <FlatList
                horizontal
                data={recommendations}
                renderItem={renderItem}
                keyExtractor={item => item.product.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    list: {
        paddingRight: 16,
    },
    card: {
        width: 150,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginRight: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    emojiPlaceholder: {
        width: '100%',
        height: 72,
        backgroundColor: '#f0f4ff',
        borderRadius: 8,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 32,
    },
    info: {
        gap: 4,
    },
    name: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
        lineHeight: 18,
    },
    reason: {
        fontSize: 11,
        color: '#888',
        fontStyle: 'italic',
    },
    price: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '700',
        marginTop: 2,
    },
    addBtn: {
        backgroundColor: '#E5F4FF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 4,
    },
    disabledBtn: {
        backgroundColor: '#f0f0f0',
    },
    addText: {
        color: '#007AFF',
        fontWeight: '700',
        fontSize: 12,
    },
});
