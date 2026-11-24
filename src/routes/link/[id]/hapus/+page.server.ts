import { error, fail, redirect } from '@sveltejs/kit';
import { deleteLink, getLink } from '$lib/server/modules/links';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	const link = id ? await getLink(id) : null;
	if (!link) error(404, 'Link tidak ditemukan — mungkin sudah dihapus.');
	return { link };
};

export const actions: Actions = {
	default: async (event) => {
		const id = parseId(event.params.id);
		const before = id ? await getLink(id) : null;
		if (!id || !before) error(404, 'Link tidak ditemukan — mungkin sudah dihapus.');

		try {
			await deleteLink(id);
		} catch (err) {
			return fail(500, { error: dbErrorMessage(err, `hapus link #${id}`) });
		}
		await finishChange(event, `Link “${before.desc}” dihapus.`, {
			action: 'delete',
			target: 'tmlink',
			id,
			before: { category: before.category, desc: before.desc, url: before.url }
		});
		redirect(303, '/link');
	}
};
