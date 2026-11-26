import { error, fail, redirect } from '@sveltejs/kit';
import { deleteCalendar, getCalendar } from '$lib/server/modules/kalender';
import { finishChange } from '$lib/server/change';
import { fileErrorMessage } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Kalender tidak ditemukan — mungkin sudah dihapus.';

/** Berkas dipilih lewat ?berkas=<nama berkas>. */
const fileParam = (url: URL) => url.searchParams.get('berkas') ?? '';

export const load: PageServerLoad = ({ url }) => {
	const found = getCalendar(fileParam(url));
	if (!found) error(404, NOT_FOUND);
	return found;
};

export const actions: Actions = {
	default: async (event) => {
		const file = fileParam(event.url);
		const found = getCalendar(file);
		if (!found) error(404, NOT_FOUND);

		try {
			await deleteCalendar(file);
		} catch (err) {
			return fail(500, { error: fileErrorMessage(err, 'menghapus kalender') });
		}

		await finishChange(
			event,
			`Kalender “${found.item.title}” dihapus.`,
			{
				action: 'delete',
				target: 'kalender',
				id: file,
				before: { file, active: found.item.active, nowActive: found.next }
			},
			{
				cache: false,
				extra: found.item.active
					? [
							{
								type: 'warn' as const,
								text: found.next
									? `Portal sekarang menampilkan kalender “${found.next}”.`
									: 'Tidak ada kalender lagi — halaman kalender kerja portal kosong.'
							}
						]
					: []
			}
		);
		redirect(303, '/kalender');
	}
};
