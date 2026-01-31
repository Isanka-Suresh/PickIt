
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
// Replaced HomeScreen with ProductListScreen as the main authenticated view
import ProductListScreen from '../screens/products/ProductListScreen';
import CartScreen from '../screens/cart/CartScreen';
import SupermarketSelectionScreen from '../screens/store/SupermarketSelectionScreen';
import BranchSelectionScreen from '../screens/store/BranchSelectionScreen';

import { useAuth } from '../context/AuthProvider';
import { useStore } from '../context/StoreProvider';
import { useCart } from '../context/CartProvider';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
    );
}

function StoreSelectionStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SupermarketSelection" component={SupermarketSelectionScreen} />
            <Stack.Screen name="BranchSelection" component={BranchSelectionScreen} />
        </Stack.Navigator>
    );
}

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

function ShopStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        </Stack.Navigator>
    );
}

function OrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MyOrdersList" component={MyOrdersScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        </Stack.Navigator>
    )
}

function AppStack() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Shop') iconName = '🛍️';
                    else if (route.name === 'Orders') iconName = '📦';
                    else if (route.name === 'Profile') iconName = '👤';

                    return <Text style={{ fontSize: size }}>{iconName}</Text>;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Shop" component={ShopStack} />
            <Tab.Screen name="Orders" component={OrdersStack} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function RootNavigator() {
    const { session, isLoading: isAuthLoading } = useAuth();
    const { selectedBranch, isLoading: isStoreLoading } = useStore();
    const { isLoading: isCartLoading } = useCart();

    if (isAuthLoading || isStoreLoading || isCartLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        )
    }

    return (
        <NavigationContainer>
            {!session ? (
                <AuthStack />
            ) : !selectedBranch ? (
                <StoreSelectionStack />
            ) : (
                <AppStack />
            )}
        </NavigationContainer>
    );
}
