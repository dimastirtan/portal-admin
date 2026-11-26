import { fail, redirect } from '@sveltejs/kit';
import { createBulletin, readBulletinForm } from '$lib/server/modules/buletin';
import { finishChange } from '$lib/server/change';
import { fileErrorMessage } from '$lib/server/uploads';
import { formatDate, todayJakarta, type Errors } from '$lib/server/text';
import type { FlashMessage } from '$lib/server/cookies';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ today: todayJakarta() });

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const { values, errors, title, day, image, hadFile } = await readBulletinForm(form, null);
		if (!image || Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		let file: string;
		try {
			file = await createBulletin(title, image.data, day);
		} catch (err) {
			const failed: Errors = { _form: fileErrorMessage(err, 'menyimpan buletin') };
			return fail(500, { values, errors: failed, hadFile });
		}

		const extra: FlashMessage[] = image.warnings.map((text) => ({ type: 'warn', text }));
		await 
			{
				action: 'create',
				target: 'buletin',
				id: file,
				after: { file, day, width: image.width, height: image.height, bytes: image.data.length }
			},
			{ cache: false, extra }
		;
		redirect(303, '/buletin');
	}
};
