/**
 * Kalender kerja: gambar di UPLOAD_DIR/kalender/. Portal (/kalender-kerja)
 * menampilkan berkas dengan waktu ubah (mtime) terbaru — tanpa DB dan tanpa
 * cache, jadi perubahan langsung tampil. "Jadikan aktif" = memajukan mtime
 * berkas lama; isinya tidak diubah.
 */
import path from 'node:path';
import { PRESETS, processImage, uploadedFile, type ProcessedImage } from '../images';
import { formatDateTime, normalize, todayJakarta, type Errors } from '../text';
import {
	fileTitle,
	fileTitleError,
	formatSize,
	imageInfo,
	listImages,
	newestMtime,
	previewUrl,
	thumbUrl,
	removeImage,
	touchImage,
	uniqueFileName,
	writeImage,
	type StoredImage
} from '../uploads';
import type { CalendarView } from '$lib/types';

const FOLDER = 'kalender';
export const TITLE_MAX = 100;

const view = (img: StoredImage, active: boolean): CalendarView => ({
	file: img.file,
	title: path.parse(img.file).name,
	date: formatDateTime(img.mtime),
	size: formatSize(img.size),
	preview: previewUrl(FOLDER, img),
	thumb: thumbUrl(FOLDER, img),
	active
});

/** Semua kalender, yang tampil di portal (terbaru) dulu. */
export const listCalendars = (): CalendarView[] =>
	listImages(FOLDER).map((img, i) => view(img, i === 0));

/** Satu kalender + kalender yang akan tampil bila yang ini dihapus. */
export function getCalendar(file: string): { item: CalendarView; next: string | null } | null {
	const all = listImages(FOLDER);
	const i = all.findIndex((img) => img.file === file);
	if (i < 0) return null;
	const next = i === 0 && all[1] ? path.parse(all[1].file).name : null;
	return { item: view(all[i], i === 0), next };
}

export async function readCalendarUpload(form: FormData): Promise<{
	values: { judul: string };
	errors: Errors;
	title: string;
	image: ProcessedImage | null;
	hadFile: boolean;
}> {
	const errors: Errors = {};
	const raw = normalize(form.get('judul')).slice(0, TITLE_MAX * 2);
	const title = fileTitle(raw) || `Kalender kerja ${todayJakarta()}`;
	const titleError = fileTitleError(title, 'Nama', TITLE_MAX);
	if (titleError) errors.judul = titleError;

	const file = uploadedFile(form, 'gambar');
	let image: ProcessedImage | null = null;
	if (!file) {
		errors.gambar = 'Pilih gambar kalender.';
	} else if (!errors.judul) {
		const result = await processImage(file, PRESETS.kalender);
		if (result.ok) image = result.image;
		else errors.gambar = result.error;
	}
	return { values: { judul: raw }, errors, title, image, hadFile: Boolean(file) };
}

/** Simpan sebagai kalender terbaru (langsung tampil); mengembalikan nama berkas. */
export async function saveCalendar(title: string, data: Buffer): Promise<string> {
	const file = uniqueFileName(FOLDER, title, '.webp');
	await writeImage(FOLDER, file, data, { mtime: newestMtime(FOLDER) });
	return file;
}

/** Jadikan berkas ini yang tampil di portal; mengembalikan berkas yang tampil sebelumnya. */
export async function activateCalendar(file: string): Promise<string | null> {
	const before = listImages(FOLDER)[0]?.file ?? null;
	if (before !== file) await touchImage(FOLDER, file, newestMtime(FOLDER));
	return before;
}

export const calendarExists = (file: string) => imageInfo(FOLDER, file) !== null;

export const deleteCalendar = (file: string) => removeImage(FOLDER, file);
