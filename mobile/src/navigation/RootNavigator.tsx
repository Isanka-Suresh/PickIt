
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import OrderSuccessScreen from '../screens/cart/OrderSuccessScreen';
import SupermarketSelectionScreen from '../screens/store/SupermarketSelectionScreen';
import BranchSelectionScreen from '../screens/store/BranchSelectionScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyOrdersScreen from '../screens/orders/MyOrdersScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';

import { useAuth } from '../context/AuthProvider';
import { useStore } from '../context/StoreProvider';
import { useCart } from '../context/CartProvider';
import { useOrderNotifications } from '../hooks/useOrderNotifications';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────
// Auth Stack
// ─────────────────────────────────────────
function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
    );
}

// ─────────────────────────────────────────
// Store Selection Stack
// ─────────────────────────────────────────
function StoreSelectionStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: true }}>
            <Stack.Screen
                name="SupermarketSelection"
                component={SupermarketSelectionScreen}
                options={{ title: 'Select Supermarket' }}
            />
            <Stack.Screen
                name="BranchSelection"
                component={BranchSelectionScreen}
                options={{ title: 'Select Branch' }}
            />
        </Stack.Navigator>
    );
}

// ─────────────────────────────────────────
// Shop Stack: Products → Cart → Checkout → Success
// ─────────────────────────────────────────
function ShopStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        </Stack.Navigator>
    );
}

// ─────────────────────────────────────────
// Orders Stack: My Orders → Order Details
// ─────────────────────────────────────────
function OrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        </Stack.Navigator>
    );
}

import HomeScreen from '../screens/home/HomeScreen';

// ─────────────────────────────────────────
// Main App Tabs
// ─────────────────────────────────────────
function AppStack() {
    const { user } = useAuth();
    // Register global order-status notifications for the logged-in user
    useOrderNotifications(user?.id);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#f0f0f0',
                    borderTopWidth: 1,
                    height: 62,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: '#4F8EF7',
                tabBarInactiveTintColor: '#bbb',
                tabBarIcon: ({ focused, size }) => {
                    const icons: Record<string, string> = {
                        Home: '🏠',
                        Shop: '🛍️',
                        Orders: '📦',
                        Profile: '👤',
                    };
                    return (
                        <Text style={{ fontSize: focused ? size + 2 : size }}>
                            {icons[route.name]}
                        </Text>
                    );
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Shop" component={ShopStack} />
            <Tab.Screen name="Orders" component={OrdersStack} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

// ─────────────────────────────────────────
// Root Navigator
// ─────────────────────────────────────────
export default function RootNavigator() {
    const { session, isLoading: isAuthLoading } = useAuth();
    const { selectedBranch, isLoading: isStoreLoading } = useStore();
    const { isLoading: isCartLoading } = useCart();

    if (isAuthLoading || isStoreLoading || isCartLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
                <ActivityIndicator size="large" color="#4F8EF7" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {!session ? <AuthStack /> :
                !selectedBranch ? <StoreSelectionStack /> :
                    <AppStack />}
        </NavigationContainer>
    );
}
