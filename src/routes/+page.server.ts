import { pool } from '$lib/server/db';
import { cacheConfigured } from '$lib/server/portal-cache';
import { uploadDirStatus } from '$lib/server/paths';
import type { PageServerLoad } from './$types';

/** Beranda: cek cepat kesiapan sistem (DB, cache portal, folder unggahan). */
export const load: PageServerLoad = async () => {
	let db: { ok: boolean; note: string };
	try {
		const started = Date.now();
		await pool.query('SELECT 1');
		db = { ok: true, note: `tersambung (${Date.now() - started} ms)` };
	} catch (err) {
		const e = err as { code?: string; message?: string };
		db = { ok: false, note: e.code ?? e.message ?? 'gagal' };
	}
	return {
		checks: [
			{ label: 'Database', ...db },
			{
				label: 'Cache portal',
				ok: cacheConfigured(),
				note: cacheConfigured()
					? 'PORTAL_URL & token terisi'
					: 'PORTAL_URL / CACHE_CLEAR_TOKEN kosong — perubahan tampil maks. 5 menit'
			},
			{ label: 'Folder unggahan', ...uploadDirStatus() }
		]
	};
};
