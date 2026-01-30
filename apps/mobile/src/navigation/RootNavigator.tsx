
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/home/HomeScreen';
import SupermarketSelectionScreen from '../screens/store/SupermarketSelectionScreen';
import BranchSelectionScreen from '../screens/store/BranchSelectionScreen';

import { useAuth } from '../context/AuthProvider';
import { useStore } from '../context/StoreProvider';
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

function AppStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
    );
}

export default function RootNavigator() {
    const { session, isLoading: isAuthLoading } = useAuth();
    const { selectedBranch, isLoading: isStoreLoading } = useStore();

    if (isAuthLoading || isStoreLoading) {
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
