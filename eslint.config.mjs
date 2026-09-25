import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['client/**', 'dist/**', 'node_modules/**']
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'commonjs'
		}
	},
	{
		files: ['**/*.ts'],
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		rules: {
			indent: ['error', 'tab', { SwitchCase: 1 }],
			quotes: ['error', 'single'],
			semi: ['error', 'always']
		}
	},
	{
		files: ['src/server/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.node
			}
		},
		rules: {
			// The server is CommonJS: `import x = require()` + `export =` is the
			// idiomatic TypeScript form for it, not a style mistake.
			'@typescript-eslint/no-require-imports': 'off'
		}
	},
	{
		files: ['src/client/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.browser
			}
		}
	}
);
