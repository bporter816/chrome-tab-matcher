import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [tailwindcss(), svelte()],
    build: {
        rolldownOptions: {
            input: {
                background: resolve(
                    import.meta.dirname,
                    "src",
                    "pages",
                    "background",
                    "index.ts",
                ),
                options: resolve(
                    import.meta.dirname,
                    "src",
                    "pages",
                    "options",
                    "index.html",
                ),
                popup: resolve(
                    import.meta.dirname,
                    "src",
                    "pages",
                    "popup",
                    "index.html",
                ),
            },
            output: {
                entryFileNames: (chunk) => `src/pages/${chunk.name}/index.js`,
            },
        },
    },
});
