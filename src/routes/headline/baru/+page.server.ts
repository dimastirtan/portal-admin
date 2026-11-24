import { fail, redirect } from '@sveltejs/kit';
import {
	createHeadline,
	headlineLimits,
	headlineSnapshot,
	listParents,
	parentExists,
	readHeadlineForm,
	readHeadlineImage,
	storeHeadlineImage
} from '$lib/server/modules/headlines';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import { todayJakarta } from '$lib/server/text';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [limits, parents] = await Promise.all([headlineLimits(), listParents()]);
	return { limits, parents, today: todayJakarta() };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const limits = await headlineLimits();
		const { values, errors } = readHeadlineForm(form, limits);
		const { image, hadFile } = await readHeadlineImage(form, errors);
		if (values.parent !== 'baru' && !(await parentExists(Number(values.parent)))) {
			errors.parent = 'Berita induk tidak ditemukan — pilih lagi.';
		}
		if (Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		let created: Awaited<ReturnType<typeof createHeadline>>;
		try {
			created = await createHeadline(values);
		} catch (err) {
			return fail(500, {
				values,
				errors: { _form: dbErrorMessage(err, 'tambah headline') },
				hadFile
			});
		}
		const extra = image ? await storeHeadlineImage(created.id, image) : [];
		await finishChange(
			event,
			`Headline “${values.title}” ditambahkan.`,
			{
				action: 'create',
				target: 'tmmainarticledet',
				id: created.id,
				after: {
					...headlineSnapshot(values),
					parentId: created.parentId,
					parentCreated: created.createdParent,
					image: image ? `${image.width}x${image.height} webp` : null
				}
			},
			{ extra }
		);
		redirect(303, '/headline');
	}
};
