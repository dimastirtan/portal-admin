import { error, fail, redirect } from '@sveltejs/kit';
import {
	editableValues,
	getHeadline,
	headlineLimits,
	headlineSnapshot,
	listParents,
	parentExists,
	readHeadlineForm,
	readHeadlineImage,
	storeHeadlineImage,
	updateHeadline,
	type Headline
} from '$lib/server/modules/headlines';
import { finishChange } from '$lib/server/change';
import { dbErrorMessage } from '$lib/server/db-error';
import type { FlashMessage } from '$lib/server/cookies';
import { deleteHeadlineImages, headlineImage, previewUrl } from '$lib/server/uploads';
import { portalLink } from '$lib/server/portal-url';
import { formatDate } from '$lib/server/text';
import { parseId } from '$lib/server/list';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Headline tidak ditemukan — mungkin sudah dihapus.';

/** Keterangan gambar yang dipakai portal bila belum ada unggahan. */
const fallbackText = (h: Headline) =>
	h.hasImg
		? 'Belum ada gambar unggahan — portal memakai gambar pertama di isi berita (data lama).'
		: h.parentImage
			? 'Belum ada gambar unggahan — portal memakai gambar berita induk (data lama).'
			: 'Belum ada gambar — di hero beranda headline ini tampil tanpa foto.';

export const load: PageServerLoad = async ({ params, url }) => {
	const id = parseId(params.id);
	const h = id ? await getHeadline(id) : null;
	if (!h) error(404, NOT_FOUND);
	const plain = url.searchParams.has('polos');
	const img = headlineImage(h.id);
	const [limits, parents] = await Promise.all([headlineLimits(), listParents()]);
	return {
		headline: { id: h.id, title: h.title, isHtml: h.isHtml, parentChildren: h.parentChildren },
		values: editableValues(h, plain),
		plain,
		limits,
		parents,
		image: img
			? {
					url: previewUrl('headline', img),
					size: `${Math.round(img.size / 1024)} KB`,
					updated: formatDate(img.mtime.toISOString())
				}
			: null,
		imageFallback: fallbackText(h),
		portalUrl: portalLink(`/berita-utama/${h.id}`)
	};
};

export const actions: Actions = {
	default: async (event) => {
		const id = parseId(event.params.id);
		const before = id ? await getHeadline(id) : null;
		if (!id || !before) error(404, NOT_FOUND);

		const form = await event.request.formData();
		const limits = await headlineLimits();
		const { values, errors } = readHeadlineForm(form, limits);
		const { image, hadFile } = await readHeadlineImage(form, errors);
		const removeImage = form.get('hapus_gambar') === '1';
		if (values.parent !== 'baru' && !(await parentExists(Number(values.parent)))) {
			errors.parent = 'Berita induk tidak ditemukan — pilih lagi.';
		}
		if (Object.keys(errors).length) return fail(400, { values, errors, hadFile });

		let result: Awaited<ReturnType<typeof updateHeadline>>;
		try {
			result = await updateHeadline(id, values, before);
		} catch (err) {
			return fail(500, {
				values,
				errors: { _form: dbErrorMessage(err, `ubah headline #${id}`) },
				hadFile
			});
		}

		const extra: FlashMessage[] = result.notes.map((text) => ({ type: 'warn', text }));
		let imageChange: string | null = null;
		if (image) {
			extra.push(...(await storeHeadlineImage(id, image)));
			imageChange = `baru ${image.width}x${image.height} webp`;
		} else if (removeImage) {
			try {
				if (await deleteHeadlineImages(id)) imageChange = 'dihapus';
			} catch (err) {
				console.error(`[headline] gambar #${id} gagal dihapus:`, err);
				extra.push({ type: 'error', text: 'Gambar unggahan gagal dihapus dari folder unggahan.' });
			}
		}
		await finishChange(
			event,
			`Headline “${values.title}” disimpan.`,
			{
				action: 'update',
				target: 'tmmainarticledet',
				id,
				before: { ...headlineSnapshot(before), parent: String(before.parentId ?? '') },
				after: {
					...headlineSnapshot(values),
					parentId: result.parentId,
					parentCreated: result.createdParent,
					image: imageChange
				}
			},
			{ extra }
		);
		redirect(303, '/headline');
	}
};
