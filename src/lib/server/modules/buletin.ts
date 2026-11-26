/**
 * Buletin: poster di UPLOAD_DIR/buletin/. Portal menampilkan 3 berkas dengan waktu
 * ubah (mtime) terbaru di Information center beranda; judul = nama berkas tanpa
 * ekstensi ("_" tampil sebagai spasi), tanggal = waktu ubah. Tanpa DB & tanpa cache.
 *
 * Tanggal terbit (form) disimpan sebagai waktu ubah: pukul 12.00 WIB tanggal itu
 * (+1 detik per buletin lain di tanggal yang sama, supaya yang terakhir disimpan di
 * depan). Pukul 12.00 WIB = 05.00 UTC, jadi tanggalnya sama walau portal memformat
 * dengan zona server UTC maupun WIB. Urutan di portal = urutan tanggal.
 *
 * - Ganti judul = ganti nama berkas (waktu ubah tetap → posisi & tanggal tetap).
 * - Ganti gambar = tulis ulang dengan waktu ubah lama (posisi & tanggal tetap).
 * - "Paling depan" = tanggal jadi hari ini.
 */
import path from 'node:path';
import { PRESETS, processImage, uploadedFile, type ProcessedImage } from '../images';
import { formatDate, jakartaDate, normalize, todayJakarta, type Errors } from '../text';
import { PAGE_SIZE, paging } from '../list';
import {
	fileTitle,
	fileTitleError,
	formatSize,
	imageInfo,
	listImages,
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
	date: formatDate(jakartaDate(img.mtime)),
	day: jakartaDate(img.mtime),
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

/**
 * Waktu ubah untuk tanggal terbit `day`: 12.00 WIB, atau 1 detik setelah buletin
 * lain bertanggal sama yang paling akhir (jadi tampil paling depan di tanggal itu).
 */
function mtimeForDay(day: string, except: string | null): Date {
	let t = new Date(`${day}T12:00:00+07:00`).getTime();
	for (const img of listImages(FOLDER)) {
		if (img.file !== except && jakartaDate(img.mtime) === day) {
			t = Math.max(t, img.mtime.getTime() + 1000);
		}
	}
	return new Date(t);
}

/** Baca & cek field tanggal (YYYY-MM-DD dari input type=date). */
function readDay(form: FormData, errors: Errors): string {
	const raw = String(form.get('tanggal') ?? '').trim();
	const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(raw);
	const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
	if (!raw) errors.tanggal = 'Tanggal wajib diisi.';
	else if (!d || d.toISOString().slice(0, 10) !== raw) errors.tanggal = 'Tanggal tidak valid.';
	else if (raw > todayJakarta()) errors.tanggal = 'Tanggal tidak boleh melewati hari ini.';
	else if (raw < '2000-01-01') errors.tanggal = 'Tanggal minimal tahun 2000.';
	return raw;
}

export type BulletinForm = {
	values: { judul: string; tanggal: string };
	errors: Errors;
	title: string;
	day: string;
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

	const day = readDay(form, errors);

	const file = uploadedFile(form, 'gambar');
	let image: ProcessedImage | null = null;
	if (!file) {
		if (!current) errors.gambar = 'Pilih gambar poster.';
	} else if (!errors.judul && !errors.tanggal) {
		const result = await processImage(file, PRESETS.buletin);
		if (result.ok) image = result.image;
		else errors.gambar = result.error;
	}
	return {
		values: { judul: raw, tanggal: day },
		errors,
		title,
		day,
		image,
		hadFile: Boolean(file)
	};
}

/** Unggah baru dengan tanggal terbit `day`. */
export async function createBulletin(title: string, data: Buffer, day: string): Promise<string> {
	const file = `${title}.webp`;
	if (imageInfo(FOLDER, file)) throw new Error(`Nama berkas sudah dipakai: ${file}`);
	await writeImage(FOLDER, file, data, { mtime: mtimeForDay(day, null) });
	return file;
}

/**
 * Ubah judul, gambar, dan/atau tanggal. `day` null = tanggal tidak diubah (waktu ubah,
 * jadi posisi di portal, tetap persis). Mengembalikan nama berkas yang baru.
 */
export async function updateBulletin(
	current: string,
	title: string,
	data: Buffer | null,
	day: string | null
): Promise<string> {
	const img = imageInfo(FOLDER, current);
	if (!img) throw new Error(`Berkas tidak ada: ${FOLDER}/${current}`);
	const mtime = day ? mtimeForDay(day, current) : img.mtime;

	if (!data) {
		const file = title + path.extname(current);
		await renameImage(FOLDER, current, file);
		if (day) await touchImage(FOLDER, file, mtime);
		return file;
	}

	const file = `${title}.webp`;
	if (file.toLowerCase() === current.toLowerCase()) {
		// Nama sama (kecuali huruf besar/kecil): ganti nama dulu, lalu timpa isinya.
		await renameImage(FOLDER, current, file);
		await writeImage(FOLDER, file, data, { mtime });
	} else {
		if (imageInfo(FOLDER, file)) throw new Error(`Nama berkas sudah dipakai: ${file}`);
		await writeImage(FOLDER, file, data, { mtime });
		await removeImage(FOLDER, current);
	}
	return file;
}

/** Majukan ke paling depan: tanggal terbit jadi hari ini. */
export const bumpBulletin = (file: string) =>
	touchImage(FOLDER, file, mtimeForDay(todayJakarta(), file));

/** Kalimat posisi untuk pesan setelah simpan: tampil di portal atau tidak. */
export function placementNote(file: string): string | null {
	const found = getBulletin(file);
	if (!found) return null;
	return found.item.shown
		? `Tampil di Information center (urutan ${found.item.rank} dari ${SHOWN}).`
		: `Bertanggal ${found.item.date}, jadi tidak termasuk ${SHOWN} terbaru — tidak tampil di Information center.`;
}

export const deleteBulletin = (file: string) => removeImage(FOLDER, file);
