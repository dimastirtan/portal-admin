import { error, fail, redirect } from '@sveltejs/kit';
import { getLink, linkLimits, readLinkForm, updateLink } from '$lib/server/modules/links';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import { setFlash } from '$lib/server/cookies';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	const link = id ? await getLink(id) : null;
	if (!link) error(404, 'Link tidak ditemukan — mungkin sudah dihapus.');
	return { link, limits: await linkLimits() };
};

export const actions: Actions = {
	default: async (event) => {
		const id = parseId(event.params.id);
		const before = id ? await getLink(id) : null;
		if (!id || !before) error(404, 'Link tidak ditemukan — mungkin sudah dihapus.');

		const limits = await linkLimits();
		const { values, errors } = readLinkForm(await event.request.formData(), limits);
		if (Object.keys(errors).length) return fail(400, { values, errors });

		let found: boolean;
		try {
			found = await updateLink(id, values, event.locals.user!.username, limits);
		} catch (err) {
			return fail(500, { values, errors: { _form: dbErrorMessage(err, `ubah link #${id}`) } });
		}
		if (!found) {
			setFlash(event.cookies, event.url, [
				{ type: 'error', text: 'Link sudah dihapus orang lain sebelum perubahan disimpan.' }
			]);
			redirect(303, '/link');
		}
		await finishChange(event, `Link “${values.desc}” disimpan.`, {
			action: 'update',
			target: 'tmlink',
			id,
			before: { category: before.category, desc: before.desc, url: before.url },
			after: values
		});
		redirect(303, '/link');
	}
};
