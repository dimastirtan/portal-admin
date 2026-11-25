import { error, fail, redirect } from '@sveltejs/kit';
import { cleanupPhoto, deleteDept, getDept, orgSnapshot } from '$lib/server/modules/organisasi';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Departemen tidak ditemukan — mungkin sudah dihapus atau dipindah.';

export const load: PageServerLoad = async ({ params }) => {
	const orgId = parseId(params.id);
	const detId = parseId(params.detId);
	const dept = orgId && detId ? await getDept(orgId, detId) : null;
	if (!dept) error(404, NOT_FOUND);
	return { dept };
};

export const actions: Actions = {
	default: async (event) => {
		const orgId = parseId(event.params.id);
		const detId = parseId(event.params.detId);
		const before = orgId && detId ? await getDept(orgId, detId) : null;
		if (!detId || !before) error(404, NOT_FOUND);
		try {
			await deleteDept(detId);
		} catch (err) {
			return fail(500, { error: dbErrorMessage(err, `hapus departemen #${detId}`) });
		}
		await cleanupPhoto(before.foto.file);
		await finishChange(event, `Departemen “${before.title}” dihapus.`, {
			action: 'delete',
			target: 'tmorgdet',
			id: detId,
			before: orgSnapshot(before, before.foto.file)
		});
		redirect(303, '/organisasi');
	}
};
