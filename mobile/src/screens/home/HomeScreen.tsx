
import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthProvider';
import { useStore } from '../../context/StoreProvider';
import { useCart, Product } from '../../context/CartProvider';
import { getPersonalRecommendations } from '../../../lib/ai';

export default function HomeScreen() {
    const { user } = useAuth();
    const { selectedBranch, selectedSupermarket, setSelectedBranch } = useStore();
    const { addToCart, items } = useCart();

    const [personalRecs, setPersonalRecs] = useState<Product[]>([]);
    const [coldStart, setColdStart] = useState(false);
    const [loadingRecs, setLoadingRecs] = useState(false);

    const fetchPersonalRecs = useCallback(async () => {
        if (!user?.id) return;
        setLoadingRecs(true);
        try {
            const { products, coldStart: cs } = await getPersonalRecommendations(
                user.id,
                selectedBranch?.id,
                8,
            );
            setPersonalRecs(products);
            setColdStart(cs);
        } finally {
            setLoadingRecs(false);
        }
    }, [user?.id, selectedBranch?.id]);

    useEffect(() => {
        fetchPersonalRecs();
    }, [fetchPersonalRecs]);

    const renderRecCard = ({ item }: { item: Product }) => {
        const inCart = items.find(i => i.product.id === item.id);
        return (
            <View style={styles.recCard}>
                <View style={styles.recEmoji}>
                    <Text style={styles.recEmojiText}>🛍️</Text>
                </View>
                <Text numberOfLines={2} style={styles.recName}>{item.name}</Text>
                {item.brand ? <Text style={styles.recBrand}>{item.brand}</Text> : null}
                <Text style={styles.recPrice}>${item.price.toFixed(2)}</Text>
                <TouchableOpacity
                    style={[styles.recAddBtn, (item.stock === 0) && styles.recDisabledBtn]}
                    disabled={item.stock === 0}
                    onPress={() => addToCart(item)}
                >
                    <Text style={styles.recAddText}>
                        {item.stock === 0 ? 'OOS' : inCart ? `In Cart (${inCart.quantity})` : 'Add'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* ── Header ── */}
            <View style={styles.headerSection}>
                <Text style={styles.greeting}>
                    Hello, {user?.email?.split('@')[0] ?? 'there'} 👋
                </Text>
                <Text style={styles.storeName}>
                    📍 {selectedSupermarket?.name} – {selectedBranch?.name}
                </Text>
            </View>

            {/* ── Personalized Recommendations ── */}
            {(loadingRecs || personalRecs.length > 0) && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {coldStart ? '🔥 Popular Picks' : '✨ Recommended for You'}
                        </Text>
                        {loadingRecs && (
                            <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />
                        )}
                    </View>
                    <Text style={styles.sectionSub}>
                        {coldStart
                            ? 'Top products loved by shoppers at this store'
                            : 'Personalised picks based on your order history'}
                    </Text>

                    {!loadingRecs && (
                        <FlatList
                            horizontal
                            data={personalRecs}
                            renderItem={renderRecCard}
                            keyExtractor={item => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.recList}
                        />
                    )}

                    {loadingRecs && (
                        <View style={styles.recSkeletonRow}>
                            {[1, 2, 3].map(k => (
                                <View key={k} style={[styles.recCard, styles.skeletonCard]} />
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* ── Quick Actions ── */}
            <View style={styles.actionsSection}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setSelectedBranch(null)}
                >
                    <Text style={styles.actionIcon}>🏪</Text>
                    <Text style={styles.actionText}>Change Store</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.logoutBtn]}
                    onPress={() => {
                        setSelectedBranch(null);
                        supabase.auth.signOut();
                    }}
                >
                    <Text style={styles.actionIcon}>🚪</Text>
                    <Text style={[styles.actionText, styles.logoutText]}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        paddingBottom: 40,
    },
    headerSection: {
        backgroundColor: '#007AFF',
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    greeting: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    storeName: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
    },

    // Recommendations section
    section: {
        paddingHorizontal: 20,
        paddingTop: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    sectionSub: {
        fontSize: 13,
        color: '#888',
        marginBottom: 16,
    },
    recList: {
        paddingRight: 4,
    },
    recCard: {
        width: 148,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
        alignItems: 'center',
    },
    recEmoji: {
        width: 64,
        height: 64,
        backgroundColor: '#EEF5FF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    recEmojiText: {
        fontSize: 30,
    },
    recName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
        textAlign: 'center',
        lineHeight: 17,
        marginBottom: 2,
    },
    recBrand: {
        fontSize: 11,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 2,
    },
    recPrice: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '800',
        marginBottom: 8,
    },
    recAddBtn: {
        backgroundColor: '#007AFF',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    recDisabledBtn: {
        backgroundColor: '#d0d0d0',
    },
    recAddText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },

    // Skeleton placeholders
    recSkeletonRow: {
        flexDirection: 'row',
    },
    skeletonCard: {
        backgroundColor: '#e8e8e8',
        height: 200,
    },

    // Quick actions
    actionsSection: {
        paddingHorizontal: 20,
        paddingTop: 32,
        gap: 12,
    },
    actionBtn: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutBtn: {
        borderWidth: 1,
        borderColor: '#ffe5e5',
        backgroundColor: '#fff5f5',
    },
    actionIcon: {
        fontSize: 22,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    logoutText: {
        color: '#FF3B30',
    },
});
