/**
 * Opsi cookie dashboard. `secure` mengikuti protokol ORIGIN: di jaringan internal
 * dashboard dibuka lewat http://, dan browser menolak cookie Secure dari http
 * (bawaan SvelteKit secure: true → login tidak akan pernah berhasil).
 */
import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE = 'sid';
const FLASH_COOKIE = 'flash';

export const cookieOptions = (url: URL, maxAge?: number) => ({
	path: '/',
	httpOnly: true,
	sameSite: 'strict' as const,
	secure: url.protocol === 'https:',
	...(maxAge ? { maxAge } : {})
});

// ── Pesan sekali tampil setelah redirect (mis. "Link disimpan.") ─────────────

export type FlashMessage = { type: 'ok' | 'warn' | 'error'; text: string };

export function setFlash(cookies: Cookies, url: URL, messages: FlashMessage[]): void {
	cookies.set(FLASH_COOKIE, JSON.stringify(messages), cookieOptions(url, 60));
}

export function takeFlash(cookies: Cookies, url: URL): FlashMessage[] {
	const raw = cookies.get(FLASH_COOKIE);
	if (!raw) return [];
	cookies.delete(FLASH_COOKIE, cookieOptions(url));
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter(
				(m): m is FlashMessage =>
					typeof m?.text === 'string' && ['ok', 'warn', 'error'].includes(m?.type)
			)
			.slice(0, 5);
	} catch {
		return [];
	}
}
