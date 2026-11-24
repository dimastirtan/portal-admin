/**
 * Langkah setelah setiap simpan/hapus: catat audit, kosongkan cache portal, dan
 * siapkan pesan untuk halaman berikutnya (dipanggil sebelum redirect).
 */
import type { RequestEvent } from '@sveltejs/kit';
import { audit, type AuditEntry } from './audit';
import { setFlash, type FlashMessage } from './cookies';
import { clearPortalCache } from './portal-cache';

export async function finishChange(
	event: RequestEvent,
	message: string,
	entry: Omit<AuditEntry, 'user' | 'ip'>,
	{
		cache = true,
		extra = []
	}: {
		/** false untuk perubahan yang tidak di-cache portal (kalender, buletin). */
		cache?: boolean;
		/** Pesan tambahan, mis. peringatan ukuran gambar. */
		extra?: FlashMessage[];
	} = {}
): Promise<void> {
	audit({ ...entry, user: event.locals.user?.username ?? '?', ip: event.getClientAddress() });
	const messages: FlashMessage[] = [{ type: 'ok', text: message }, ...extra];
	if (cache) {
		const result = await clearPortalCache();
		if (result !== 'ok') {
			messages.push({
				type: 'warn',
				text:
					result === 'off'
						? 'Cache portal tidak dikosongkan (PORTAL_URL / CACHE_CLEAR_TOKEN belum diisi) — perubahan tampil di portal maks. 5 menit lagi.'
						: 'Cache portal gagal dikosongkan — perubahan tampil di portal maks. 5 menit lagi.'
			});
		}
	}
	setFlash(event.cookies, event.url, messages);
}
