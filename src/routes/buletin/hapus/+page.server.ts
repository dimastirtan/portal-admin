import { error, fail, redirect } from '@sveltejs/kit';
import { deleteBulletin, getBulletin } from '$lib/server/modules/buletin';
import { finishChange } from '$lib/server/change';
import { fileErrorMessage } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Buletin tidak ditemukan — mungkin sudah dihapus.';

/** Berkas dipilih lewat ?berkas=<nama berkas>. */
const fileParam = (url: URL) => url.searchParams.get('berkas') ?? '';

export const load: PageServerLoad = ({ url }) => {
	const found = getBulletin(fileParam(url));
	if (!found) error(404, NOT_FOUND);
	return found;
};

export const actions: Actions = {
	default: async (event) => {
		const file = fileParam(event.url);
		const found = getBulletin(file);
		if (!found) error(404, NOT_FOUND);

		try {
			await deleteBulletin(file);
		} catch (err) {
			return fail(500, { error: fileErrorMessage(err, 'menghapus buletin') });
		}

		await finishChange(
			event,
			`Buletin “${found.item.title}” dihapus.`,
			{
				action: 'delete',
				target: 'buletin',
				id: file,
				before: { file, rank: found.item.rank, date: found.item.date }
			},
			{
				cache: false,
				extra: found.next
					? [{ type: 'ok', text: `“${found.next}” sekarang ikut tampil di Information center.` }]
					: []
			}
		);
		redirect(303, '/buletin');
	}
};
