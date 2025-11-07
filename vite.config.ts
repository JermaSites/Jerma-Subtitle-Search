import { defineConfig } from 'vite';

export default defineConfig({
	appType: 'spa',
	build: {
		rollupOptions: {
			output: {
				// Removes hashes from filenames:
				// assetFileNames: 'assets/[name][extname]',
				// chunkFileNames: '[name].js',
				// entryFileNames: '[name].js'
			}
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
				silenceDeprecations: ['legacy-js-api']
			}
		}
	},
	esbuild: {
		// Enables JSX:
		// jsx: 'transform',
		// jsxFactory: 'm',
		// jsxFragment: ''['',
	}
});
