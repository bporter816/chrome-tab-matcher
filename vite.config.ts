import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte()],
    build: {
        rollupOptions: {
            input: {
                background: resolve(__dirname, 'src', 'pages', 'background', 'index.ts'),
                options: resolve(__dirname, 'src', 'pages', 'options', 'index.html'),
                popup: resolve(__dirname, 'src', 'pages', 'popup', 'index.html'),
            },
            output: {
                entryFileNames: (chunk) => `src/pages/${chunk.name}/index.js`
            }
        }
    }
});
