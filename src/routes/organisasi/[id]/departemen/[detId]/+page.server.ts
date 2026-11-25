import { error, fail, redirect } from '@sveltejs/kit';
import {
	employees,
	getDept,
	orgLimits,
	orgSnapshot,
	readDeptForm,
	readOrgPhoto,
	saveWithPhoto,
	unitOptions,
	updateDept
} from '$lib/server/modules/organisasi';
import { finishChange } from '$lib/server/change';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Departemen tidak ditemukan — mungkin sudah dihapus atau dipindah.';

export const load: PageServerLoad = async ({ params }) => {
	const orgId = parseId(params.id);
	const detId = parseId(params.detId);
	const dept = orgId && detId ? await getDept(orgId, detId) : null;
	if (!dept) error(404, NOT_FOUND);
	const [limits, { list }, units] = await Promise.all([orgLimits(), employees(), unitOptions()]);
	return { dept, limits, employees: list, units };
};

export const actions: Actions = {
	default: async (event) => {
		const orgId = parseId(event.params.id);
		const detId = parseId(event.params.detId);
		const before = orgId && detId ? await getDept(orgId, detId) : null;
		if (!detId || !before) error(404, NOT_FOUND);

		const form = await event.request.formData();
		const { values, errors } = await readDeptForm(form, await orgLimits(), {
			currentNik: before.nik
		});
		const { image, hadFile } = await readOrgPhoto(form, errors);
		if (Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		const saved = await saveWithPhoto({
			current: before.foto.file,
			nik: values.nik,
			fallback: 'dept',
			image,
			remove: form.get('hapus_foto') === '1',
			context: `ubah departemen #${detId}`,
			write: (foto) => updateDept(detId, values, foto, event.locals.user!.username)
		});
		if (!saved.ok) return fail(500, { values, errors: { _form: saved.error }, hadFile });

		await finishChange(
			event,
			`Departemen “${values.title}” disimpan.`,
			{
				action: 'update',
				target: 'tmorgdet',
				id: detId,
				before: orgSnapshot(before, before.foto.file),
				after: orgSnapshot(values, saved.foto)
			},
			{ extra: (image?.warnings ?? []).map((text) => ({ type: 'warn' as const, text })) }
		);
		redirect(303, '/organisasi');
	}
};
