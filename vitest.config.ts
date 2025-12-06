import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
	},
	resolve: {
		// Force a single React renderer instance for tests that import from the package workspace
		dedupe: ['react', 'react-dom'],
		alias: {
			react: path.resolve(__dirname, 'node_modules/react'),
			'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
		},
	},
});
