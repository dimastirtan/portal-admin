import { error, fail, redirect } from '@sveltejs/kit';
import { deleteHeadline, getHeadline, headlineSnapshot } from '$lib/server/modules/headlines';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import { headlineImage } from '$lib/server/uploads';
import { formatDate } from '$lib/server/text';
import { parseId } from '$lib/server/list';
import type { FlashMessage } from '$lib/server/cookies';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Headline tidak ditemukan — mungkin sudah dihapus.';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseId(params.id);
	const h = id ? await getHeadline(id) : null;
	if (!h) error(404, NOT_FOUND);
	return {
		headline: {
			id: h.id,
			title: h.title,
			date: formatDate(h.date),
			parentTitle: h.parentTitle,
			// Induk ikut terhapus bila headline ini satu-satunya anaknya.
			parentGoes: Boolean(h.parentId) && h.parentChildren === 1,
			hasImage: Boolean(headlineImage(h.id))
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		const id = parseId(event.params.id);
		const before = id ? await getHeadline(id) : null;
		if (!id || !before) error(404, NOT_FOUND);

		let result: Awaited<ReturnType<typeof deleteHeadline>>;
		try {
			result = await deleteHeadline(before);
		} catch (err) {
			return fail(500, { error: dbErrorMessage(err, `hapus headline #${id}`) });
		}
		const extra: FlashMessage[] = [];
		if (result.parentDeleted) {
			extra.push({
				type: 'warn',
				text: `Berita induk “${before.parentTitle || `#${before.parentId}`}” ikut dihapus (tidak punya headline lain).`
			});
		}
		await finishChange(
			event,
			`Headline “${before.title}” dihapus.`,
			{
				action: 'delete',
				target: 'tmmainarticledet',
				id,
				before: {
					...headlineSnapshot(before),
					parentId: before.parentId,
					parentDeleted: result.parentDeleted,
					imagesDeleted: result.images
				}
			},
			{ extra }
		);
		redirect(303, '/headline');
	}
};
