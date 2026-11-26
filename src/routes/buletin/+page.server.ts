import { fail, redirect } from '@sveltejs/kit';
import { bumpBulletin, getBulletin, listBulletins } from '$lib/server/modules/buletin';
import { finishChange } from '$lib/server/change';
import { listParams } from '$lib/server/list';
import { fileErrorMessage } from '$lib/server/uploads';
import { portalLink } from '$lib/server/portal-url';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const { q, page } = listParams(url);
	return { q, ...listBulletins(q, page), portalUrl: portalLink('/') };
};

export const actions: Actions = {
	/** Majukan ke paling depan — tampil di Information center dengan tanggal hari ini. */
	naikkan: async (event) => {
		const form = await event.request.formData();
		const file = String(form.get('berkas') ?? '');
		const found = getBulletin(file);
		if (!found) return fail(404, { error: 'Buletin tidak ditemukan — mungkin sudah dihapus.' });

		try {
			await bumpBulletin(file);
		} catch (err) {
			return fail(500, { error: fileErrorMessage(err, 'memajukan buletin') });
		}

		await finishChange(
			event,
			`Buletin “${found.item.title}” sekarang paling depan di Information center.`,
			{
				action: 'update',
				target: 'buletin',
				id: file,
				before: { rank: found.item.rank },
				after: { rank: 1 }
			},
			{ cache: false }
		);
		redirect(303, '/buletin');
	}
};
