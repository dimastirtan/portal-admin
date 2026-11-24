import { listHeadlines } from '$lib/server/modules/headlines';
import { listParams, paging } from '$lib/server/list';
import { portalLink } from '$lib/server/portal-url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { q, page, offset } = listParams(url);
	const { total, rows } = await listHeadlines({ q, offset });
	return { q, rows, paging: paging(page, total), portalBase: portalLink('/berita-utama/') };
};
