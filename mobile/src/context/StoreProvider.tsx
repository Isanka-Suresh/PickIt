
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { Database } from '../types/supabase';

export type Supermarket = Database['public']['Tables']['supermarkets']['Row'];
export type Branch = Database['public']['Tables']['branches']['Row'];

type StoreContextType = {
    selectedSupermarket: Supermarket | null;
    selectedBranch: Branch | null;
    setSelectedSupermarket: (supermarket: Supermarket | null) => void;
    setSelectedBranch: (branch: Branch | null) => void;
    isLoading: boolean;
};

const StoreContext = createContext<StoreContextType>({
    selectedSupermarket: null,
    selectedBranch: null,
    setSelectedSupermarket: () => { },
    setSelectedBranch: () => { },
    isLoading: true,
});

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSelection();
    }, []);

    const loadSelection = async () => {
        try {
            const branchJson = await AsyncStorage.getItem('selectedBranch');
            const supermarketJson = await AsyncStorage.getItem('selectedSupermarket');

            if (branchJson) setSelectedBranch(JSON.parse(branchJson));
            if (supermarketJson) setSelectedSupermarket(JSON.parse(supermarketJson));
        } catch (e) {
            console.error('Failed to load store selection', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetBranch = async (branch: Branch | null) => {
        setSelectedBranch(branch);
        if (branch) {
            await AsyncStorage.setItem('selectedBranch', JSON.stringify(branch));
        } else {
            await AsyncStorage.removeItem('selectedBranch');
        }
    };

    const handleSetSupermarket = async (supermarket: Supermarket | null) => {
        setSelectedSupermarket(supermarket);
        if (supermarket) {
            await AsyncStorage.setItem('selectedSupermarket', JSON.stringify(supermarket));
        } else {
            await AsyncStorage.removeItem('selectedSupermarket');
        }
        // If supermarket changes, reset branch
        handleSetBranch(null);
    };

    return (
        <StoreContext.Provider value={{
            selectedSupermarket,
            selectedBranch,
            setSelectedSupermarket: handleSetSupermarket,
            setSelectedBranch: handleSetBranch,
            isLoading
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => useContext(StoreContext);
