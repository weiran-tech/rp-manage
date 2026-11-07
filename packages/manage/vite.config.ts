import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { host: '0.0.0.0', port: 4802, strictPort: true },
    preview: { port: 4802, strictPort: true },
    test: { server: { deps: { inline: true } }, environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'], css: false,
        pool: 'threads', maxWorkers: 2, testTimeout: 20_000 },
});
