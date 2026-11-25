import { error, fail, redirect } from '@sveltejs/kit';
import { cleanupPhoto, deleteUnit, getUnit, orgSnapshot } from '$lib/server/modules/organisasi';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Unit tidak ditemukan — mungkin sudah dihapus.';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	const unit = id ? await getUnit(id) : null;
	if (!unit) error(404, NOT_FOUND);
	return { unit };
};

export const actions: Actions = {
	default: async (event) => {
		const id = parseId(event.params.id);
		const before = id ? await getUnit(id) : null;
		if (!id || !before) error(404, NOT_FOUND);
		// Unit dengan departemen tidak boleh dihapus — departemennya akan "yatim".
		if (before.departments.length) {
			return fail(400, { error: 'Hapus atau pindahkan dulu semua departemen di unit ini.' });
		}
		try {
			await deleteUnit(id);
		} catch (err) {
			return fail(500, { error: dbErrorMessage(err, `hapus unit #${id}`) });
		}
		await cleanupPhoto(before.foto.file);
		await finishChange(event, `Unit “${before.title}” dihapus.`, {
			action: 'delete',
			target: 'tmorg',
			id,
			before: orgSnapshot(before, before.foto.file)
		});
		redirect(303, '/organisasi');
	}
};
