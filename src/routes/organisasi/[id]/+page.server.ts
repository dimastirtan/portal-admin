import { error, fail, redirect } from '@sveltejs/kit';
import {
	employees,
	getUnit,
	orgLimits,
	orgSnapshot,
	readOrgPhoto,
	readUnitForm,
	saveWithPhoto,
	updateUnit
} from '$lib/server/modules/organisasi';
import { finishChange } from '$lib/server/change';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Unit tidak ditemukan — mungkin sudah dihapus.';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	const unit = id ? await getUnit(id) : null;
	if (!unit) error(404, NOT_FOUND);
	const [limits, { list }] = await Promise.all([orgLimits(), employees()]);
	return { unit, limits, employees: list };
};

export const actions: Actions = {
	default: async (event) => {
		const id = parseId(event.params.id);
		const before = id ? await getUnit(id) : null;
		if (!id || !before) error(404, NOT_FOUND);

		const form = await event.request.formData();
		const { values, errors } = await readUnitForm(form, await orgLimits(), {
			id,
			currentNik: before.nik
		});
		const { image, hadFile } = await readOrgPhoto(form, errors);
		if (Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		const saved = await saveWithPhoto({
			current: before.foto.file,
			nik: values.nik,
			fallback: 'unit',
			image,
			remove: form.get('hapus_foto') === '1',
			context: `ubah unit #${id}`,
			write: (foto) => updateUnit(id, values, foto, event.locals.user!.username)
		});
		if (!saved.ok) return fail(500, { values, errors: { _form: saved.error }, hadFile });

		await finishChange(
			event,
			`Unit “${values.title}” disimpan.`,
			{
				action: 'update',
				target: 'tmorg',
				id,
				before: orgSnapshot(before, before.foto.file),
				after: orgSnapshot(values, saved.foto)
			},
			{ extra: (image?.warnings ?? []).map((text) => ({ type: 'warn' as const, text })) }
		);
		redirect(303, '/organisasi');
	}
};
