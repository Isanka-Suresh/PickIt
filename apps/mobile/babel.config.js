module.exports = {
	presets: ["babel-preset-expo"],
	plugins: [
		[
			"module-resolver",
			{
				root: ["./"],
				alias: {
					"@api": "./src/api",
					"@screens": "./src/screens",
					"@components": "./src/components",
					"@navigation": "./src/navigation",
					"@redux": "./src/redux",
					"@assets": "./src/assets",
					"@hooks": "./src/hooks",
					"@utils": "./src/utils",
					"@shared": "../shared",
				},
			},
		],
		"@babel/plugin-proposal-export-namespace-from",
		"nativewind/babel",
		"react-native-reanimated/plugin",
	],
};
