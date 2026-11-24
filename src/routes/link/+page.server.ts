import { linkLimits, listLinks } from '$lib/server/modules/links';
import { listParams, paging } from '$lib/server/list';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, offset } = listParams(url);
	const rawKat = url.searchParams.get('kat');
	const kat = rawKat === '1' ? 1 : rawKat === '0' ? 0 : null;
	const [{ total, rows }, limits] = await Promise.all([
		listLinks({ q, kat, offset }),
		linkLimits()
	]);
	return { q, kat, rows, limits, paging: paging(page, total) };
};
