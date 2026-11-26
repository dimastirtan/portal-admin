/**
 * Buletin: poster di UPLOAD_DIR/buletin/. Portal menampilkan 3 berkas dengan waktu
 * ubah (mtime) terbaru di Information center beranda; judul = nama berkas tanpa
 * ekstensi ("_" tampil sebagai spasi), tanggal = waktu ubah. Tanpa DB & tanpa cache.
 *
 * - Ganti judul = ganti nama berkas (waktu ubah tetap → posisi & tanggal tetap).
 * - Ganti gambar = tulis ulang dengan waktu ubah lama (posisi & tanggal tetap).
 * - "Tampilkan paling depan" = waktu ubah dimajukan ke sekarang.
 */
import path from 'node:path';
import { PRESETS, processImage, uploadedFile, type ProcessedImage } from '../images';
import { formatDateTime, normalize, type Errors } from '../text';
import { PAGE_SIZE, paging } from '../list';
import {
	fileTitle,
	fileTitleError,
	formatSize,
	imageInfo,
	listImages,
	newestMtime,
	previewUrl,
	removeImage,
	renameImage,
	thumbUrl,
	touchImage,
	writeImage,
	type StoredImage
} from '../uploads';
import type { BulletinView, Paging } from '$lib/types';

const FOLDER = 'buletin';
/** Jumlah poster yang tampil di portal (bulletins() portal). */
export const SHOWN = 3;
export const TITLE_MAX = 100;

/** Judul seperti di portal: nama berkas tanpa ekstensi, "_" jadi spasi. */
const portalTitle = (file: string) => path.parse(file).name.replace(/_+/g, ' ').trim();

const view = (img: StoredImage, index: number): BulletinView => ({
	file: img.file,
	title: portalTitle(img.file),
	date: formatDateTime(img.mtime),
	size: formatSize(img.size),
	preview: previewUrl(FOLDER, img),
	thumb: thumbUrl(FOLDER, img),
	rank: index + 1,
	shown: index < SHOWN
});

export function listBulletins(
	q: string,
	page: number
): { rows: BulletinView[]; paging: Paging; total: number } {
	const all = listImages(FOLDER).map(view);
	const needle = q.toLowerCase();
	const found = needle ? all.filter((b) => b.title.toLowerCase().includes(needle)) : all;
	const start = (page - 1) * PAGE_SIZE;
	return {
		rows: found.slice(start, start + PAGE_SIZE),
		paging: paging(page, found.length),
		total: all.length
	};
}

/** Satu buletin + poster yang naik ke Information center bila yang ini dihapus. */
export function getBulletin(file: string): { item: BulletinView; next: string | null } | null {
	const all = listImages(FOLDER);
	const i = all.findIndex((img) => img.file === file);
	if (i < 0) return null;
	const next = i < SHOWN && all[SHOWN] ? portalTitle(all[SHOWN].file) : null;
	return { item: view(all[i], i), next };
}

export const bulletinExists = (file: string) => imageInfo(FOLDER, file) !== null;

/** Judul (huruf kecil) yang sudah dipakai buletin lain — nama berkas & tampilan portal. */
function takenTitles(except: string | null): Set<string> {
	const taken = new Set<string>();
	for (const img of listImages(FOLDER)) {
		if (img.file === except) continue;
		taken.add(path.parse(img.file).name.toLowerCase());
		taken.add(portalTitle(img.file).toLowerCase());
	}
	return taken;
}

export type BulletinForm = {
	values: { judul: string };
	errors: Errors;
	title: string;
	image: ProcessedImage | null;
	hadFile: boolean;
};

/** Baca form unggah/ubah. `current` = berkas yang sedang diubah (null = unggah baru). */
export async function readBulletinForm(
	form: FormData,
	current: string | null
): Promise<BulletinForm> {
	const errors: Errors = {};
	const raw = normalize(form.get('judul')).slice(0, TITLE_MAX * 2);
	const title = fileTitle(raw);
	if (!title) {
		errors.judul = 'Judul wajib diisi.';
	} else {
		const tooLong = fileTitleError(title, 'Judul', TITLE_MAX);
		const taken = takenTitles(current);
		if (tooLong) errors.judul = tooLong;
		else if (
			taken.has(title.toLowerCase()) ||
			taken.has(title.replace(/_+/g, ' ').trim().toLowerCase())
		) {
			errors.judul = 'Judul ini sudah dipakai buletin lain — bedakan, mis. dengan nomor edisi.';
		}
	}

	const file = uploadedFile(form, 'gambar');
	let image: ProcessedImage | null = null;
	if (!file) {
		if (!current) errors.gambar = 'Pilih gambar poster.';
	} else if (!errors.judul) {
		const result = await processImage(file, PRESETS.buletin);
		if (result.ok) image = result.image;
		else errors.gambar = result.error;
	}
	return { values: { judul: raw }, errors, title, image, hadFile: Boolean(file) };
}

/** Unggah baru → langsung jadi yang terbaru (tampil paling depan). */
export async function createBulletin(title: string, data: Buffer): Promise<string> {
	const file = `${title}.webp`;
	if (imageInfo(FOLDER, file)) throw new Error(`Nama berkas sudah dipakai: ${file}`);
	await writeImage(FOLDER, file, data, { mtime: newestMtime(FOLDER) });
	return file;
}

/**
 * Ubah judul dan/atau gambar; waktu ubah (posisi & tanggal di portal) tetap.
 * Mengembalikan nama berkas yang baru.
 */
export async function updateBulletin(
	current: string,
	title: string,
	data: Buffer | null
): Promise<string> {
	const img = imageInfo(FOLDER, current);
	if (!img) throw new Error(`Berkas tidak ada: ${FOLDER}/${current}`);

	if (!data) {
		const file = title + path.extname(current);
		await renameImage(FOLDER, current, file);
		return file;
	}

	const file = `${title}.webp`;
	if (file.toLowerCase() === current.toLowerCase()) {
		// Nama sama (kecuali huruf besar/kecil): ganti nama dulu, lalu timpa isinya.
		await renameImage(FOLDER, current, file);
		await writeImage(FOLDER, file, data, { mtime: img.mtime });
	} else {
		if (imageInfo(FOLDER, file)) throw new Error(`Nama berkas sudah dipakai: ${file}`);
		await writeImage(FOLDER, file, data, { mtime: img.mtime });
		await removeImage(FOLDER, current);
	}
	return file;
}

/** Majukan ke paling depan (tampil di portal, tanggal = sekarang). */
export const bumpBulletin = (file: string) => touchImage(FOLDER, file, newestMtime(FOLDER));

export const deleteBulletin = (file: string) => removeImage(FOLDER, file);
