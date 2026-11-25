import { listUnits, orphanDeptCount } from '$lib/server/modules/organisasi';
import { portalLink } from '$lib/server/portal-url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [units, orphans] = await Promise.all([listUnits(), orphanDeptCount()]);
	return { units, orphans, portalUrl: portalLink('/organisasi') };
};
