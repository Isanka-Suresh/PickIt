import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../context/StoreProvider';
import { useCart, Product } from '../../context/CartProvider';
import { useNavigation } from '@react-navigation/native';
import Skeleton from '../../components/Skeleton';
import AddedToCartPanel from '../../components/AddedToCartPanel';
import SubstituteBanner from '../../components/SubstituteBanner';

export default function ProductListScreen() {
    const navigation = useNavigation<any>();
    const { selectedBranch } = useStore();
    const { addToCart, items } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [lastAdded, setLastAdded] = useState<Product | null>(null);

    useEffect(() => {
        if (selectedBranch) {
            fetchProducts();
        }
    }, [selectedBranch]);

    async function fetchProducts() {
        try {
            if (!selectedBranch?.id) return;
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('branch_id', selectedBranch.id)
                .eq('is_active', true);

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleDismissPanel = useCallback(() => setLastAdded(null), []);

    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))] as string[];
    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const categoryEmoji = (category: string | null | undefined) => {
        switch (category) {
            case 'Fruits': return '🍎';
            case 'Vegetables': return '🥦';
            case 'Dairy': return '🥛';
            case 'Bakery': return '🍞';
            case 'Meat': return '🥩';
            case 'Seafood': return '🐟';
            case 'Beverages': return '🥤';
            case 'Snacks': return '🥨';
            case 'Grains': return '🍚';
            case 'Spices': return '🌶️';
            default: return '🛒';
        }
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const cartItem = items.find(i => i.product.id === item.id);
        const quantity = cartItem ? cartItem.quantity : 0;

        return (
            <View style={{ marginBottom: 15 }}>
                <View style={styles.card}>
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>{categoryEmoji(item.category)}</Text>
                    </View>

                    <View style={styles.info}>
                        <Text style={styles.name}>{item.name}</Text>
                        {(item.brand || item.unit) ? (
                            <Text style={styles.meta}>
                                {item.brand ?? ''}
                                {item.brand && item.unit ? '  ·  ' : ''}
                                {item.unit ?? ''}
                            </Text>
                        ) : null}
                        {item.sub_category ? (
                            <Text style={styles.subCategory}>{item.sub_category}</Text>
                        ) : null}
                        <Text style={styles.price}>Rs. {item.price.toFixed(0)}</Text>
                        {item.stock === 0 && <Text style={styles.outOfStock}>Out of Stock</Text>}
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, item.stock === 0 && styles.disabledButton]}
                        onPress={() => {
                            addToCart(item);
                            setLastAdded(item);
                        }}
                        disabled={item.stock === 0}
                    >
                        <Text style={styles.buttonText}>
                            {quantity > 0 ? `In Cart (${quantity})` : 'Add'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Show AI Substitutes directly in the list if item is Out of Stock */}
                {item.stock === 0 && (
                    <SubstituteBanner outOfStockProduct={item} />
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Products</Text>
                </View>
                <View style={{ marginBottom: 20 }}>
                    <Skeleton width={100} height={40} style={{ borderRadius: 20 }} />
                </View>
                {[1, 2, 3].map(key => (
                    <View key={key} style={styles.card}>
                        <Skeleton width={80} height={80} style={{ marginRight: 15 }} />
                        <View style={{ flex: 1 }}>
                            <Skeleton width="80%" height={20} style={{ marginBottom: 10 }} />
                            <Skeleton width="40%" height={16} />
                        </View>
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.screenWrapper}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Products</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
                        <Text style={styles.cartButtonText}>🛒 Cart ({items.length})</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.categories}>
                    <FlatList
                        horizontal
                        data={categories}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.chip, selectedCategory === item && styles.selectedChip]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text style={[styles.chipText, selectedCategory === item && styles.selectedChipText]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                <FlatList
                    data={filteredProducts}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📦</Text>
                            <Text style={styles.emptyText}>No products available</Text>
                        </View>
                    }
                />
            </View>

            {/* Slide-up panel after adding a product */}
            <AddedToCartPanel
                addedProduct={lastAdded}
                onDismiss={handleDismissPanel}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
        position: 'relative',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 10,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    cartButton: {
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 20,
    },
    cartButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    categories: {
        marginBottom: 15,
        height: 40,
    },
    chip: {
        backgroundColor: '#e1e1e1',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    selectedChip: {
        backgroundColor: '#007AFF',
    },
    chipText: {
        color: '#333',
    },
    selectedChipText: {
        color: '#fff',
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 15,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 28,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
        color: '#1a1a1a',
    },
    meta: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    subCategory: {
        fontSize: 11,
        color: '#aaa',
        marginBottom: 4,
    },
    price: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: 'bold',
        marginTop: 2,
    },
    outOfStock: {
        color: 'red',
        fontSize: 12,
        marginTop: 2,
    },
    addButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
