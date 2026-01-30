import React from 'react';
import { AuthProvider } from './src/context/AuthProvider';
import { StoreProvider } from './src/context/StoreProvider';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
	return (
		<AuthProvider>
			<StoreProvider>
				<RootNavigator />
			</StoreProvider>
		</AuthProvider>
	);
}
