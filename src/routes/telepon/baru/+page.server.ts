import { fail, redirect } from '@sveltejs/kit';
import { createTelp, readTelpForm, telpLimits, telpSnapshot } from '$lib/server/modules/telepon';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// "+ Tambah" dari daftar yang sedang difilter → kelompok itu terpilih.
	const kat = url.searchParams.get('kat') ?? '';
	return { limits: await telpLimits(), category: /^[0-2]$/.test(kat) ? Number(kat) : 0 };
};

export const actions: Actions = {
	default: async (event) => {
		const limits = await telpLimits();
		const { values, errors } = readTelpForm(await event.request.formData(), limits);
		if (Object.keys(errors).length) return fail(400, { values, errors });

		let id: number;
		try {
			id = await createTelp(values, event.locals.user!.username, limits);
		} catch (err) {
			return fail(500, { values, errors: { _form: dbErrorMessage(err, 'tambah telepon') } });
		}
		await finishChange(event, `Nomor “${values.title}” ditambahkan.`, {
			action: 'create',
			target: 'tmtelp',
			id,
			after: telpSnapshot(values)
		});
		redirect(303, '/telepon');
	}
};
