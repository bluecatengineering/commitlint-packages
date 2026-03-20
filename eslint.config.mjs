import js from '@eslint/js';
import globals from 'globals';
import jestPlugin from 'eslint-plugin-jest';
import prettier from 'eslint-config-prettier';

export default [
	prettier,
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'commonjs',
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		rules: {
			...js.configs.recommended.rules,
			eqeqeq: 'error',
			'no-console': 'off',
			'no-unused-vars': 'warn',
			'no-var': 'warn',
			'prefer-arrow-callback': 'warn',
			'prefer-const': ['warn', {destructuring: 'all'}],
		},
	},
	{
		files: ['**/*.test.js'],
		plugins: {
			jest: jestPlugin,
		},
		languageOptions: {
			globals: globals.jest,
		},
		rules: {
			...jestPlugin.configs['flat/recommended'].rules,
		},
	},
	{
		ignores: ['node_modules/**', 'coverage/**'],
	},
];
