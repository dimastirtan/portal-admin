/**
 * Kosongkan cache data portal setelah menyimpan: POST <PORTAL_URL>/api/cache dengan
 * Authorization: Bearer <CACHE_CLEAR_TOKEN> (lihat src/routes/api/cache di portal).
 * Gagal di sini TIDAK menggagalkan simpan — perubahan tetap tampil setelah cache
 * portal kedaluwarsa (CACHE_TTL_SECONDS portal, default 5 menit).
 */
import { env } from '$env/dynamic/private';

export type CacheResult = 'ok' | 'off' | 'failed';

export async function clearPortalCache(): Promise<CacheResult> {
	const base = env.PORTAL_URL?.trim();
	const token = env.CACHE_CLEAR_TOKEN?.trim();
	if (!base || !token) return 'off';
	try {
		const res = await fetch(new URL('/api/cache', base), {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(3000)
		});
		if (!res.ok) {
			console.warn(`[cache] POST ${base}/api/cache → HTTP ${res.status}`);
			return 'failed';
		}
		const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
		return body?.ok ? 'ok' : 'failed';
	} catch (err) {
		console.warn(`[cache] POST ${base}/api/cache gagal:`, (err as Error).message);
		return 'failed';
	}
}

export const cacheConfigured = () =>
	Boolean(env.PORTAL_URL?.trim() && env.CACHE_CLEAR_TOKEN?.trim());
