import { fail, redirect } from '@sveltejs/kit';
import {
	admins,
	checkLogin,
	clearLoginFailures,
	createSession,
	loginBlockedFor,
	recordLoginFailure,
	SESSION_MAX_MS
} from '$lib/server/auth';
import { audit } from '$lib/server/audit';
import { SESSION_COOKIE, cookieOptions } from '$lib/server/cookies';
import type { Actions, PageServerLoad } from './$types';

/** Hanya path internal ("/link?q=x"), bukan "//situs-lain" atau URL penuh. */
const safeNext = (raw: string | null) =>
	raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('ke')));
	return { configured: admins().size > 0 };
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '')
			.trim()
			.toLowerCase()
			.slice(0, 50);
		const password = String(form.get('password') ?? '').slice(0, 200);
		const ip = getClientAddress();

		const wait = loginBlockedFor(ip, username);
		if (wait > 0) {
			return fail(429, {
				username,
				error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(wait / 60_000)} menit.`
			});
		}
		if (!username || !password || !(await checkLogin(username, password))) {
			recordLoginFailure(ip, username);
			audit({ user: username || '-', action: 'login-failed', ip });
			return fail(400, { username, error: 'Username atau kata sandi salah.' });
		}

		clearLoginFailures(ip, username);
		cookies.set(SESSION_COOKIE, createSession(username), cookieOptions(url, SESSION_MAX_MS / 1000));
		audit({ user: username, action: 'login', ip });
		redirect(303, safeNext(url.searchParams.get('ke')));
	}
};
