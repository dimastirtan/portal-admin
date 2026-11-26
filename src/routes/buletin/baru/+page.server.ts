import { fail, redirect } from '@sveltejs/kit';
import { createBulletin, readBulletinForm } from '$lib/server/modules/buletin';
import { finishChange } from '$lib/server/change';
import { fileErrorMessage } from '$lib/server/uploads';
import type { Errors } from '$lib/server/text';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const { values, errors, title, image, hadFile } = await readBulletinForm(form, null);
		if (!image || Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		let file: string;
		try {
			file = await createBulletin(title, image.data);
		} catch (err) {
			const failed: Errors = { _form: fileErrorMessage(err, 'menyimpan buletin') };
			return fail(500, { values, errors: failed, hadFile });
		}

		await finishChange(
			event,
			`Buletin “${title}” diunggah — tampil paling depan di Information center.`,
			{
				action: 'create',
				target: 'buletin',
				id: file,
				after: { file, width: image.width, height: image.height, bytes: image.data.length }
			},
			{ cache: false, extra: image.warnings.map((text) => ({ type: 'warn' as const, text })) }
		);
		redirect(303, '/buletin');
	}
};
