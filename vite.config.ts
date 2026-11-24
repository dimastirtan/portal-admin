import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import legacyColors from './scripts/postcss-legacy-colors.js';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	css: {
		// Warna cadangan untuk Chrome/Edge 109 (Windows 7/8.1) — salinan plugin portal.
		postcss: { plugins: [legacyColors()] }
	},
	// Port dev berbeda dari portal (5173) supaya keduanya bisa jalan bersamaan.
	server: { port: 5280, strictPort: true },
	preview: { port: 4280 }
});
