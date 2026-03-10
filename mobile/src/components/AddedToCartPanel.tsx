
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Animated,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Product, useCart } from '../context/CartProvider';
import { useStore } from '../context/StoreProvider';
import { getComboRecommendationsWithMeta } from '../../lib/ai';
import { useNavigation } from '@react-navigation/native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const AUTO_DISMISS_MS = 5000;

type RecommendedItem = { product: Product; reason: string };

type Props = {
    addedProduct: Product | null;
    onDismiss: () => void;
};

export default function AddedToCartPanel({ addedProduct, onDismiss }: Props) {
    const navigation = useNavigation<any>();
    const { items, addToCart } = useCart();
    const { selectedBranch } = useStore();
    const translateY = useRef(new Animated.Value(300)).current;
    const [recs, setRecs] = useState<RecommendedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Slide in / out helpers ──────────────────────────────────────────
    const slideIn = useCallback(() => {
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
            speed: 14,
        }).start();
    }, [translateY]);

    const slideOut = useCallback(() => {
        Animated.timing(translateY, {
            toValue: 300,
            duration: 260,
            useNativeDriver: true,
        }).start(() => onDismiss());
    }, [translateY, onDismiss]);

    // ── Fetch combo recs whenever a new product is added ─────────────────
    useEffect(() => {
        if (!addedProduct) return;

        // Reset & slide in
        setRecs([]);
        translateY.setValue(300);
        slideIn();

        // Clear any previous auto-dismiss
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        dismissTimer.current = setTimeout(slideOut, AUTO_DISMISS_MS);

        // Fetch recs
        const cartIds = [...items.map(i => i.product.id), addedProduct.id];
        setLoading(true);
        getComboRecommendationsWithMeta(cartIds, selectedBranch?.id, 5)
            .then(results => {
                // Filter out items already in cart
                const filtered = results.filter(r => r.product.id !== addedProduct.id && !items.find(i => i.product.id === r.product.id));
                setRecs(filtered);
            })
            .finally(() => setLoading(false));

        return () => {
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
        };
    }, [addedProduct?.id]);

    if (!addedProduct) return null;

    const renderRec = ({ item }: { item: RecommendedItem }) => (
        <TouchableOpacity
            style={styles.recCard}
            activeOpacity={0.85}
            onPress={() => {
                addToCart(item.product);
                setRecs(prev => prev.filter(r => r.product.id !== item.product.id));
            }}
            disabled={item.product.stock === 0}
        >
            <View style={styles.recEmoji}>
                <Text style={styles.recEmojiText}>{categoryEmoji(item.product.category)}</Text>
            </View>
            <Text numberOfLines={2} style={styles.recName}>{item.product.name}</Text>
            <Text style={styles.recPrice}>Rs. {item.product.price.toFixed(0)}</Text>
            <View style={[styles.addBtn, item.product.stock === 0 && styles.addBtnDisabled]}>
                <Text style={styles.addBtnText}>{item.product.stock === 0 ? 'OOS' : '+ Add'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Animated.View style={[styles.panel, { transform: [{ translateY }] }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                    </View>
                    <View>
                        <Text style={styles.addedText}>Added to cart</Text>
                        <Text numberOfLines={1} style={styles.productName}>{addedProduct.name}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={slideOut} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
            </View>

            {/* Recommendations */}
            {loading ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Finding combos…</Text>
                </View>
            ) : recs.length > 0 ? (
                <View style={styles.recsSection}>
                    <Text style={styles.recsTitle}>🤖 People also buy</Text>
                    <FlatList
                        horizontal
                        data={recs}
                        renderItem={renderRec}
                        keyExtractor={item => item.product.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.recsList}
                    />
                </View>
            ) : null}

            {/* Footer */}
            <TouchableOpacity
                style={styles.viewCartBtn}
                onPress={() => {
                    slideOut();
                    navigation.navigate('Cart');
                }}
            >
                <Text style={styles.viewCartText}>View Cart</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

function categoryEmoji(category?: string | null): string {
    const map: Record<string, string> = {
        Dairy: '🥛',
        Bakery: '🍞',
        Grains: '🌾',
        Meat: '🥩',
        Seafood: '🐟',
        Produce: '🥦',
        Beverages: '🥤',
        Pantry: '🫙',
        Household: '🧴',
    };
    return category ? (map[category] ?? '🛒') : '🛒';
}

const styles = StyleSheet.create({
    panel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 16,
        zIndex: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    checkCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#34C759',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkIcon: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    addedText: {
        fontSize: 12,
        color: '#34C759',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        maxWidth: 220,
    },
    closeBtn: {
        padding: 4,
    },
    closeText: {
        fontSize: 16,
        color: '#aaa',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
        paddingLeft: 2,
    },
    loadingText: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
    },
    recsSection: {
        marginBottom: 14,
    },
    recsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    recsList: {
        paddingRight: 8,
    },
    recCard: {
        width: 120,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 10,
        marginRight: 10,
        alignItems: 'center',
    },
    recEmoji: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    recEmojiText: {
        fontSize: 22,
    },
    recName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a1a1a',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 4,
    },
    recPrice: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '700',
        marginBottom: 6,
    },
    addBtn: {
        backgroundColor: '#007AFF',
        paddingVertical: 4,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    addBtnDisabled: {
        backgroundColor: '#ccc',
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    viewCartBtn: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    viewCartText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.3,
    },
});
