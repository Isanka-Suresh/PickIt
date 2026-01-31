
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Product, useCart } from '../context/CartProvider';
import { useStore } from '../context/StoreProvider';
import { getRecommendations } from '../../lib/ai';

export default function RecommendationList() {
    const { items, addToCart } = useCart();
    const { selectedBranch } = useStore();
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Debounce fetching to avoid spamming while user is adding items rapidly
        const timer = setTimeout(() => {
            fetchRecommendations();
        }, 1000);

        return () => clearTimeout(timer);
    }, [items.length]); // Re-fetch when cart item count changes

    async function fetchRecommendations() {
        if (items.length === 0) {
            setRecommendations([]);
            return;
        }

        setLoading(true);
        const itemIds = items.map(i => i.product.id);
        const recs = await getRecommendations(itemIds, selectedBranch?.id);

        // Filter out items already in cart
        const filteredRecs = recs.filter(rec => !items.find(i => i.product.id === rec.id));

        setRecommendations(filteredRecs);
        setLoading(false);
    }

    if (recommendations.length === 0 && !loading) return null;

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.card}>
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.placeholder]}><Text>Img</Text></View>
            )}
            <View style={styles.info}>
                <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                        addToCart(item);
                        // Optimistically remove from recs
                        setRecommendations(prev => prev.filter(p => p.id !== item.id));
                    }}
                >
                    <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>You might also like</Text>
                {loading && <ActivityIndicator size="small" style={{ marginLeft: 10 }} />}
            </View>
            <FlatList
                horizontal
                data={recommendations}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        marginTop: 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 5
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    list: {
        paddingRight: 20
    },
    card: {
        width: 140,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginRight: 15,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    image: {
        width: '100%',
        height: 80,
        borderRadius: 6,
        backgroundColor: '#eee',
        marginBottom: 8
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    info: {
        alignItems: 'flex-start'
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4
    },
    price: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8
    },
    addBtn: {
        backgroundColor: '#E5F4FF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15
    },
    addText: {
        color: '#007AFF',
        fontWeight: 'bold',
        fontSize: 12
    }
});
