
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../context/StoreProvider';
import { useCart, Product } from '../../context/CartProvider';
import { useNavigation } from '@react-navigation/native';

export default function ProductListScreen() {
    const navigation = useNavigation<any>();
    const { selectedBranch } = useStore();
    const { addToCart, items } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    useEffect(() => {
        if (selectedBranch) {
            fetchProducts();
        }
    }, [selectedBranch]);

    async function fetchProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('branch_id', selectedBranch?.id);

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }

    const categories = ['All', ...new Set(products.map(p => p.category))];
    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const renderProduct = ({ item }: { item: Product }) => {
        const cartItem = items.find(i => i.product.id === item.id);
        const quantity = cartItem ? cartItem.quantity : 0;

        return (
            <View style={styles.card}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, styles.placeholder]}><Text>No Image</Text></View>
                )}

                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                    {item.stock_quantity === 0 && <Text style={styles.outOfStock}>Out of Stock</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.addButton, (item.stock_quantity === 0) && styles.disabledButton]}
                    onPress={() => addToCart(item)}
                    disabled={item.stock_quantity === 0}
                >
                    <Text style={styles.buttonText}>
                        {quantity > 0 ? `In Cart (${quantity})` : 'Add'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
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
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 10,
        paddingTop: 50,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 10
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
        fontSize: 14
    },
    categories: {
        marginBottom: 15,
        height: 40
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
        color: '#333'
    },
    selectedChipText: {
        color: '#fff'
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
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 15,
        backgroundColor: '#eee'
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    info: {
        flex: 1
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5
    },
    price: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: 'bold'
    },
    outOfStock: {
        color: 'red',
        fontSize: 12,
        marginTop: 2
    },
    addButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8
    },
    disabledButton: {
        backgroundColor: '#ccc'
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    }
});
