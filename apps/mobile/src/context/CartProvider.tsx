
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Product = {
    id: string;
    branch_id: string;
    name: string;
    description?: string;
    price: number;
    stock_quantity: number;
    image_url?: string;
    category: string;
};

export type CartItem = {
    product: Product;
    quantity: number;
};

type CartContextType = {
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalPrice: number;
    isLoading: boolean;
};

const CartContext = createContext<CartContextType>({
    items: [],
    addToCart: () => { },
    removeFromCart: () => { },
    updateQuantity: () => { },
    clearCart: () => { },
    totalPrice: 0,
    isLoading: true,
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        saveCart();
    }, [items]);

    const loadCart = async () => {
        try {
            const cartJson = await AsyncStorage.getItem('cart');
            if (cartJson) setItems(JSON.parse(cartJson));
        } catch (e) {
            console.error('Failed to load cart', e);
        } finally {
            setIsLoading(false);
        }
    };

    const saveCart = async () => {
        // Only save if not loading to prevent overwriting with empty
        if (!isLoading) {
            await AsyncStorage.setItem('cart', JSON.stringify(items));
        }
    };

    const addToCart = (product: Product) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                // Validation: Check stock
                if (existing.quantity >= product.stock_quantity) return prev;

                return prev.map((i) =>
                    i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setItems((prev) =>
            prev.map((i) => {
                if (i.product.id === productId) {
                    // Validate stock
                    if (quantity > i.product.stock_quantity) return i;
                    return { ...i, quantity };
                }
                return i;
            })
        );
    };

    const removeFromCart = (productId: string) => {
        setItems((prev) => prev.filter((i) => i.product.id !== productId));
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalPrice = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalPrice,
                isLoading,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
