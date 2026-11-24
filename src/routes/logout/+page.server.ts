import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth';
import { audit } from '$lib/server/audit';
import { SESSION_COOKIE, cookieOptions } from '$lib/server/cookies';
import type { Actions, PageServerLoad } from './$types';

// Keluar hanya lewat POST (tombol di header) — GET /logout cukup kembali ke beranda.
export const load: PageServerLoad = () => redirect(303, '/');

export const actions: Actions = {
	default: ({ cookies, url, locals, getClientAddress }) => {
		const sid = cookies.get(SESSION_COOKIE);
		if (sid) destroySession(sid);
		cookies.delete(SESSION_COOKIE, cookieOptions(url));
		if (locals.user)
			audit({ user: locals.user.username, action: 'logout', ip: getClientAddress() });
		redirect(303, '/login');
	}
};
