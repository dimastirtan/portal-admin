import { fail, redirect } from '@sveltejs/kit';
import {
	createUnit,
	employees,
	orgLimits,
	orgSnapshot,
	readOrgPhoto,
	readUnitForm,
	saveWithPhoto
} from '$lib/server/modules/organisasi';
import { finishChange } from '$lib/server/change';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [limits, { list }] = await Promise.all([orgLimits(), employees()]);
	return { limits, employees: list };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const { values, errors } = await readUnitForm(form, await orgLimits());
		const { image, hadFile } = await readOrgPhoto(form, errors);
		if (Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		const saved = await saveWithPhoto({
			current: '',
			nik: values.nik,
			fallback: 'unit',
			image,
			remove: false,
			context: 'tambah unit',
			write: (foto) => createUnit(values, foto, event.locals.user!.username)
		});
		if (!saved.ok) return fail(500, { values, errors: { _form: saved.error }, hadFile });

		await finishChange(
			event,
			`Unit “${values.title}” ditambahkan.`,
			{
				action: 'create',
				target: 'tmorg',
				id: saved.result,
				after: orgSnapshot(values, saved.foto)
			},
			{ extra: (image?.warnings ?? []).map((text) => ({ type: 'warn' as const, text })) }
		);
		redirect(303, '/organisasi');
	}
};
