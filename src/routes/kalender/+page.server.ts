import { fail, redirect } from '@sveltejs/kit';
import {
	activateCalendar,
	calendarExists,
	listCalendars,
	readCalendarUpload,
	saveCalendar
} from '$lib/server/modules/kalender';
import { finishChange } from '$lib/server/change';
import { fileErrorMessage } from '$lib/server/uploads';
import { portalLink } from '$lib/server/portal-url';
import type { Errors } from '$lib/server/text';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	items: listCalendars(),
	portalUrl: portalLink('/kalender-kerja')
});

export const actions: Actions = {
	unggah: async (event) => {
		const form = await event.request.formData();
		const { values, errors, title, image, hadFile } = await readCalendarUpload(form);
		if (!image || Object.keys(errors).length) {
			return fail(400, { action: 'unggah' as const, values, errors, hadFile });
		}

		let file: string;
		try {
			file = await saveCalendar(title, image.data);
		} catch (err) {
			const error = fileErrorMessage(err, 'menyimpan kalender');
			const errors: Errors = { _form: error };
			return fail(500, { action: 'unggah' as const, values, errors, hadFile });
		}

		await finishChange(
			event,
			`Kalender “${file.slice(0, -'.webp'.length)}” diunggah dan sekarang tampil di portal.`,
			{
				action: 'create',
				target: 'kalender',
				id: file,
				after: { file, width: image.width, height: image.height, bytes: image.data.length }
			},
			{
				cache: false,
				extra: image.warnings.map((text) => ({ type: 'warn' as const, text }))
			}
		);
		redirect(303, '/kalender');
	},

	aktifkan: async (event) => {
		const form = await event.request.formData();
		const file = String(form.get('berkas') ?? '');
		if (!calendarExists(file)) {
			return fail(404, {
				action: 'aktifkan' as const,
				error: 'Kalender tidak ditemukan — mungkin sudah dihapus.'
			});
		}

		let before: string | null;
		try {
			before = await activateCalendar(file);
		} catch (err) {
			const error = fileErrorMessage(err, 'mengaktifkan kalender');
			return fail(500, { action: 'aktifkan' as const, error });
		}

		await finishChange(
			event,
			`Kalender “${file.replace(/\.[^.]+$/, '')}” sekarang tampil di portal.`,
			{
				action: 'update',
				target: 'kalender',
				id: file,
				before: { active: before },
				after: { active: file }
			},
			{ cache: false }
		);
		redirect(303, '/kalender');
	}
};
