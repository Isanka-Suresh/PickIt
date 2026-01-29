import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';

const App = () => {
	const [status, setStatus] = useState<string>('Connecting...');

	useEffect(() => {
		async function checkConnection() {
			const { data, error } = await supabase.from('supermarkets').select('count');
			if (error) {
				setStatus('Error: ' + error.message);
			} else {
				setStatus('Connected! Supermarkets count: ' + (data ? data.length : 0));
			}
		}
		checkConnection();
	}, []);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>PickIt Mobile</Text>
			<Text style={styles.status}>{status}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F5FCFF',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		color: '#333',
	},
	status: {
		fontSize: 16,
		color: '#666',
	},
});

export default App;
