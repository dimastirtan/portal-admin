import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Semua halaman dirender di server (lihat src/routes/+layout.ts: csr = false).
		adapter: adapter(),
		// CSP: dashboard tidak memuat skrip/gaya dari luar. SvelteKit menambahkan
		// nonce/hash sendiri bila suatu halaman memakai skrip.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:'],
				'font-src': ['self'],
				'connect-src': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'object-src': ['none']
			}
		}
	}
};

export default config;
