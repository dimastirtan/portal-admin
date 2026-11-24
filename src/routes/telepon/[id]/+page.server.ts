import { error, fail, redirect } from '@sveltejs/kit';
import {
	getTelp,
	readTelpForm,
	telpLimits,
	telpSnapshot,
	updateTelp
} from '$lib/server/modules/telepon';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import { setFlash } from '$lib/server/cookies';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Nomor telepon tidak ditemukan — mungkin sudah dihapus.';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	const telp = id ? await getTelp(id) : null;
	if (!telp) error(404, NOT_FOUND);
	return { telp, limits: await telpLimits() };
};

export const actions: Actions = {
	default: async (event) => {
		const id = parseId(event.params.id);
		const before = id ? await getTelp(id) : null;
		if (!id || !before) error(404, NOT_FOUND);

		const limits = await telpLimits();
		const { values, errors } = readTelpForm(await event.request.formData(), limits);
		if (Object.keys(errors).length) return fail(400, { values, errors });

		let found: boolean;
		try {
			found = await updateTelp(id, values, event.locals.user!.username, limits);
		} catch (err) {
			return fail(500, { values, errors: { _form: dbErrorMessage(err, `ubah telepon #${id}`) } });
		}
		if (!found) {
			setFlash(event.cookies, event.url, [
				{ type: 'error', text: 'Nomor sudah dihapus orang lain sebelum perubahan disimpan.' }
			]);
			redirect(303, '/telepon');
		}
		await finishChange(event, `Nomor “${values.title}” disimpan.`, {
			action: 'update',
			target: 'tmtelp',
			id,
			before: telpSnapshot(before),
			after: telpSnapshot(values)
		});
		redirect(303, '/telepon');
	}
};
