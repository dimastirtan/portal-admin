import { error, fail, redirect } from '@sveltejs/kit';
import { deleteTelp, getTelp, telpSnapshot } from '$lib/server/modules/telepon';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Nomor telepon tidak ditemukan — mungkin sudah dihapus.';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	const telp = id ? await getTelp(id) : null;
	if (!telp) error(404, NOT_FOUND);
	return { telp };
};

export const actions: Actions = {
	default: async (event) => {
		const id = parseId(event.params.id);
		const before = id ? await getTelp(id) : null;
		if (!id || !before) error(404, NOT_FOUND);

		try {
			await deleteTelp(id);
		} catch (err) {
			return fail(500, { error: dbErrorMessage(err, `hapus telepon #${id}`) });
		}
		await finishChange(event, `Nomor “${before.title}” dihapus.`, {
			action: 'delete',
			target: 'tmtelp',
			id,
			before: telpSnapshot(before)
		});
		redirect(303, '/telepon');
	}
};
