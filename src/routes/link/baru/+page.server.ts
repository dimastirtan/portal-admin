import { fail, redirect } from '@sveltejs/kit';
import { createLink, linkLimits, readLinkForm } from '$lib/server/modules/links';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ limits: await linkLimits() });

export const actions: Actions = {
	default: async (event) => {
		const limits = await linkLimits();
		const { values, errors } = readLinkForm(await event.request.formData(), limits);
		if (Object.keys(errors).length) return fail(400, { values, errors });

		let id: number;
		try {
			id = await createLink(values, event.locals.user!.username, limits);
		} catch (err) {
			return fail(500, { values, errors: { _form: dbErrorMessage(err, 'tambah link') } });
		}
		await finishChange(event, `Link “${values.desc}” ditambahkan.`, {
			action: 'create',
			target: 'tmlink',
			id,
			after: values
		});
		redirect(303, '/link');
	}
};
