import { listTelp } from '$lib/server/modules/telepon';
import { listParams, paging } from '$lib/server/list';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, offset } = listParams(url);
	const rawKat = url.searchParams.get('kat') ?? '';
	const kat = /^[0-2]$/.test(rawKat) ? Number(rawKat) : null;
	const { total, rows } = await listTelp({ q, kat, offset });
	return { q, kat, rows, paging: paging(page, total) };
};
