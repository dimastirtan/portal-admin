/**
 * Semua halaman di belakang login, kecuali /login. Plus header keamanan dasar &
 * tanpa cache browser (data admin tidak boleh tampil dari tombol Back setelah logout).
 */
import { redirect, type Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/auth';
import { SESSION_COOKIE, cookieOptions } from '$lib/server/cookies';

const PUBLIC_PATHS = new Set(['/login']);

export const handle: Handle = async ({ event, resolve }) => {
	const sid = event.cookies.get(SESSION_COOKIE);
	const session = sid ? getSession(sid) : null;
	event.locals.user = session ? { username: session.username } : null;

	if (!session && !PUBLIC_PATHS.has(event.url.pathname)) {
		if (sid) event.cookies.delete(SESSION_COOKIE, cookieOptions(event.url));
		const back = event.url.pathname + event.url.search;
		redirect(303, back === '/' ? '/login' : `/login?ke=${encodeURIComponent(back)}`);
	}

	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'same-origin');
	if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'no-store');
	return response;
};
