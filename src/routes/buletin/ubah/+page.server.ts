import { error, fail, redirect } from '@sveltejs/kit';
import {
	getBulletin,
	readBulletinForm,
	updateBulletin
} from '$lib/server/modules/buletin';
import { finishChange } from '$lib/server/change';
import { fileErrorMessage } from '$lib/server/uploads';
import { todayJakarta, type Errors } from '$lib/server/text';
import type { FlashMessage } from '$lib/server/cookies';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Buletin tidak ditemukan — mungkin sudah dihapus.';

/** Berkas dipilih lewat ?berkas=<nama berkas>. */
const fileParam = (url: URL) => url.searchParams.get('berkas') ?? '';

export const load: PageServerLoad = ({ url }) => {
	const found = getBulletin(fileParam(url));
	if (!found) error(404, NOT_FOUND);
	return { item: found.item, today: todayJakarta() };
};

export const actions: Actions = {
	default: async (event) => {
		const current = fileParam(event.url);
		const found = getBulletin(current);
		if (!found) error(404, NOT_FOUND);

		const form = await event.request.formData();
		const { values, errors, title, day, image, hadFile } = await readBulletinForm(form, current);
		if (Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		const dayChanged = day !== found.item.day;
		let file: string;
		try {
			file = await updateBulletin(current, title, image?.data ?? null, dayChanged ? day : null);
		} catch (err) {
			const failed: Errors = { _form: fileErrorMessage(err, 'menyimpan buletin') };
			return fail(500, { values, errors: failed, hadFile });
		}

		const changed = [
			title !== found.item.title ? 'judul' : '',
			image ? 'gambar' : '',
			dayChanged ? 'tanggal' : ''
		].filter(Boolean);
		const extra: FlashMessage[] = (image?.warnings ?? []).map((text) => ({ type: 'warn', text }));
		await
			{
				action: 'update',
				target: 'buletin',
				id: file,
				before: { file: current, day: found.item.day },
				after: image
					? { file, day, width: image.width, height: image.height, bytes: image.data.length }
					: { file, day }
			},
			{ cache: false, extra }
		;
		redirect(303, '/buletin');
	}
};
