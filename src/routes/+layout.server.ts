import { takeFlash } from '$lib/server/cookies';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, cookies, url }) => ({
	user: locals.user,
	flash: takeFlash(cookies, url)
});
