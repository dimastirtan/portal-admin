import { error, fail, redirect } from '@sveltejs/kit';
import {
	createDept,
	employees,
	getUnit,
	orgLimits,
	orgSnapshot,
	readDeptForm,
	readOrgPhoto,
	saveWithPhoto,
	unitOptions
} from '$lib/server/modules/organisasi';
import { finishChange } from '$lib/server/change';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Unit tidak ditemukan — mungkin sudah dihapus.';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	const unit = id ? await getUnit(id) : null;
	if (!unit) error(404, NOT_FOUND);
	const [limits, { list }, units] = await Promise.all([orgLimits(), employees(), unitOptions()]);
	return { unit: { id: unit.id, title: unit.title }, limits, employees: list, units };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const { values, errors } = await readDeptForm(form, await orgLimits());
		const { image, hadFile } = await readOrgPhoto(form, errors);
		if (Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		const saved = await saveWithPhoto({
			current: '',
			nik: values.nik,
			fallback: 'dept',
			image,
			remove: false,
			context: 'tambah departemen',
			write: (foto) => createDept(values, foto, event.locals.user!.username)
		});
		if (!saved.ok) return fail(500, { values, errors: { _form: saved.error }, hadFile });

		await finishChange(
			event,
			`Departemen “${values.title}” ditambahkan.`,
			{
				action: 'create',
				target: 'tmorgdet',
				id: saved.result,
				after: orgSnapshot(values, saved.foto)
			},
			{ extra: (image?.warnings ?? []).map((text) => ({ type: 'warn' as const, text })) }
		);
		redirect(303, '/organisasi');
	}
};
