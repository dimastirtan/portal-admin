/**
 * Folder unggahan portal (UPLOAD_DIR) — kontrak dengan src/lib/server/uploads.ts portal:
 *
 *   headline/   gambar headline "<id headline>.<webp|jpg|png>" (terbaru menang)
 *   org/        foto pejabat, nama = kolom foto tmorg/tmorgdet
 *   org-thumb/  thumbnail foto pejabat (nama sama)
 *   buletin/    poster buletin, judul = nama berkas
 *   kalender/   gambar kalender kerja (yang tampil = terbaru)
 *
 * Nama berkas: tanpa / \ NUL dan tidak diawali titik (portal menolak selain itu).
 * Berkas ditulis atomik (berkas sementara ".xxx.tmp" lalu rename), jadi portal tidak
 * pernah membaca gambar setengah jadi; berkas sementara diabaikan portal.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { uploadDir } from './paths';
import { normalize } from './text';

export const UPLOAD_FOLDERS = ['headline', 'org', 'org-thumb', 'buletin', 'kalender'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const isUploadFolder = (s: string): s is UploadFolder =>
	(UPLOAD_FOLDERS as readonly string[]).includes(s);

/** Ekstensi yang dibaca portal sebagai gambar. */
export const IMAGE_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif'
};

export const isSafeFileName = (name: string) =>
	Boolean(name) && name.length <= 200 && !/[/\\\0]/.test(name) && !name.startsWith('.');

export const folderPath = (folder: UploadFolder) => path.join(uploadDir(), folder);

export type StoredImage = { file: string; full: string; type: string; size: number; mtime: Date };

export function imageInfo(folder: UploadFolder, file: string): StoredImage | null {
	if (!isSafeFileName(file)) return null;
	const type = IMAGE_TYPES[path.extname(file).toLowerCase()];
	if (!type) return null;
	const full = path.join(folderPath(folder), file);
	const st = fs.statSync(full, { throwIfNoEntry: false });
	return st?.isFile() ? { file, full, type, size: st.size, mtime: st.mtime } : null;
}

/** Semua gambar di folder, terbaru dulu (urutan yang sama dengan portal). */
export function listImages(folder: UploadFolder): StoredImage[] {
	let names: string[];
	try {
		names = fs.readdirSync(folderPath(folder));
	} catch {
		return [];
	}
	return names
		.map((file) => imageInfo(folder, file))
		.filter((img): img is StoredImage => img !== null)
		.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

/** Tulis berkas secara atomik; `mtime` opsional (mis. mempertahankan urutan buletin). */
export async function writeImage(
	folder: UploadFolder,
	file: string,
	data: Buffer,
	opts: { mtime?: Date } = {}
): Promise<void> {
	if (!isSafeFileName(file)) throw new Error(`Nama berkas tidak aman: ${file}`);
	const dir = folderPath(folder);
	await fs.promises.mkdir(dir, { recursive: true });
	const tmp = path.join(dir, `.${randomBytes(6).toString('hex')}.tmp`);
	try {
		await fs.promises.writeFile(tmp, data);
		if (opts.mtime) await fs.promises.utimes(tmp, opts.mtime, opts.mtime);
		await fs.promises.rename(tmp, path.join(dir, file));
	} catch (err) {
		await fs.promises.rm(tmp, { force: true });
		throw err;
	}
}

export async function removeImage(folder: UploadFolder, file: string): Promise<void> {
	if (!isSafeFileName(file)) return;
	await fs.promises.rm(path.join(folderPath(folder), file), { force: true });
}

/** Ukuran berkas untuk tampilan: "512 KB", "1,2 MB". */
export const formatSize = (bytes: number) =>
	bytes < 1024 * 1024
		? `${Math.max(1, Math.round(bytes / 1024))} KB`
		: `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;

// ── Folder berurutan waktu (kalender, buletin): nama berkas = judul ───────────

/**
 * Pengganti karakter yang tidak boleh di nama berkas Windows/Linux
 * (kode 92 = garis miring terbalik).
 */
const NAME_CHAR_MAP = new Map([
	['/', '-'],
	['|', '-'],
	[String.fromCharCode(92), '-'],
	[':', '-'],
	['"', "'"],
	['?', ''],
	['*', ''],
	['<', ''],
	['>', '']
]);

/**
 * Judul → nama berkas tanpa ekstensi, mis. "Buletin 1/2026: Edisi?" →
 * "Buletin 1-2026 - Edisi". Karakter kontrol dibuang, titik/spasi di awal & akhir dibuang.
 */
export function fileTitle(raw: unknown): string {
	return [...normalize(raw).replace(/: /g, ' - ')]
		.filter((ch) => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127)
		.map((ch) => NAME_CHAR_MAP.get(ch) ?? ch)
		.join('')
		.replace(/ {2,}/g, ' ')
		.replace(/^[. ]+|[. ]+$/g, '');
}

/** Pesan galat untuk judul berkas yang terlalu panjang; null bila boleh. */
export function fileTitleError(title: string, label: string, max: number): string | null {
	if (title.length > max) return `${label} maksimal ${max} karakter (sekarang ${title.length}).`;
	// Batas nama berkas Linux 255 byte; huruf non-Latin bisa 3–4 byte per karakter.
	if (Buffer.byteLength(title) > 180)
		return `${label} terlalu panjang untuk nama berkas — persingkat.`;
	return null;
}

/** Judul berkas yang sudah dipakai di folder (huruf kecil, tanpa ekstensi). */
export function takenTitles(folder: UploadFolder): Set<string> {
	try {
		return new Set(fs.readdirSync(folderPath(folder)).map((n) => path.parse(n).name.toLowerCase()));
	} catch {
		return new Set();
	}
}

/** "<judul><ext>", atau "<judul> (2)<ext>" dst. bila judul itu sudah dipakai. */
export function uniqueFileName(folder: UploadFolder, title: string, ext: string): string {
	const taken = takenTitles(folder);
	for (let i = 1; ; i++) {
		const name = i === 1 ? title : `${title} (${i})`;
		if (!taken.has(name.toLowerCase())) return name + ext;
	}
}

/**
 * Waktu ubah yang menjadikan berkas paling baru di folder — portal memilih mtime
 * terbaru. Biasanya "sekarang"; lebih maju bila ada berkas ber-mtime di masa depan.
 */
export function newestMtime(folder: UploadFolder): Date {
	const newest = listImages(folder)[0];
	return new Date(Math.max(Date.now(), newest ? newest.mtime.getTime() + 1000 : 0));
}

/** Ubah waktu ubah berkas (urutan di portal) tanpa mengubah isinya. */
export async function touchImage(folder: UploadFolder, file: string, mtime: Date): Promise<void> {
	const img = imageInfo(folder, file);
	if (!img) throw new Error(`Berkas tidak ada: ${folder}/${file}`);
	await fs.promises.utimes(img.full, mtime, mtime);
}

/**
 * Ganti nama berkas (waktu ubah tetap, jadi urutan di portal tidak berubah).
 * Menolak menimpa berkas lain; beda huruf besar/kecil saja tetap boleh.
 */
export async function renameImage(folder: UploadFolder, from: string, to: string): Promise<void> {
	if (!isSafeFileName(to)) throw new Error(`Nama berkas tidak aman: ${to}`);
	const img = imageInfo(folder, from);
	if (!img) throw new Error(`Berkas tidak ada: ${folder}/${from}`);
	if (from === to) return;
	if (from.toLowerCase() !== to.toLowerCase() && imageInfo(folder, to)) {
		throw new Error(`Nama berkas sudah dipakai: ${folder}/${to}`);
	}
	await fs.promises.rename(img.full, path.join(folderPath(folder), to));
}

/** Pesan untuk galat tulis/hapus di UPLOAD_DIR (detail ke console). */
export function fileErrorMessage(err: unknown, context: string): string {
	console.error(`[unggahan] ${context} gagal:`, err);
	const code = (err as NodeJS.ErrnoException)?.code;
	return `Gagal ${context} di folder unggahan (UPLOAD_DIR)${code ? ` — ${code}` : ''}. Periksa folder & hak tulisnya.`;
}

/** URL pratinjau di dashboard (lihat src/routes/media), dengan ?v= agar tidak memakai cache lama. */
export const previewUrl = (folder: UploadFolder, img: StoredImage) =>
	`/media/${folder}/${encodeURIComponent(img.file)}?v=${img.mtime.getTime().toString(36)}`;

/** Thumbnail kecil (maks. 240 px) untuk daftar — jauh lebih ringan dari gambar aslinya. */
export const thumbUrl = (folder: UploadFolder, img: StoredImage) =>
	`${previewUrl(folder, img)}&w=${THUMB_SIDE}`;

export const THUMB_SIDE = 240;

// ── Gambar headline: "<id>.<ext>" ─────────────────────────────────────────────

const headlineFiles = (id: number) =>
	listImages('headline').filter((img) => path.parse(img.file).name === String(id));

/** Gambar headline yang dipakai portal (terbaru bila ada beberapa ekstensi). */
export const headlineImage = (id: number): StoredImage | null => headlineFiles(id)[0] ?? null;

/** id headline yang punya gambar unggahan. */
export function headlineImageIds(): Set<number> {
	const ids = new Set<number>();
	for (const img of listImages('headline')) {
		const id = Number(path.parse(img.file).name);
		if (Number.isInteger(id) && id > 0) ids.add(id);
	}
	return ids;
}

/** Simpan "<id>.webp" lalu hapus ekstensi lain milik id yang sama. */
export async function saveHeadlineImage(id: number, data: Buffer): Promise<void> {
	const file = `${id}.webp`;
	await writeImage('headline', file, data);
	for (const img of headlineFiles(id))
		if (img.file !== file) await removeImage('headline', img.file);
}

export async function deleteHeadlineImages(id: number): Promise<number> {
	const files = headlineFiles(id);
	for (const img of files) await removeImage('headline', img.file);
	return files.length;
}

// ── Foto pejabat: org/<nama> + org-thumb/<nama> ───────────────────────────────

/**
 * Nama unik untuk foto baru, mis. "123456-mwu4twg3a1.webp" — tidak pernah menimpa
 * foto lama (portal lama punya "eka.jpg" dst. di static/).
 */
export const newOrgPhotoName = (nik: string, fallback: string) =>
	`${/^\d{1,9}$/.test(nik) ? nik : fallback}-${Date.now().toString(36)}${randomBytes(1).toString('hex')}.webp`;

/** true bila nama ini berkas unggahan dashboard (ada di UPLOAD_DIR/org atau org-thumb). */
export const isUploadedOrgPhoto = (file: string) =>
	Boolean(imageInfo('org-thumb', file) ?? imageInfo('org', file));

/** URL pratinjau thumbnail (atau foto asli) unggahan; null bila bukan unggahan. */
export function orgPhotoPreview(file: string): string | null {
	const img = imageInfo('org-thumb', file) ?? imageInfo('org', file);
	if (!img) return null;
	return previewUrl(
		img.full.includes(`${path.sep}org-thumb${path.sep}`) ? 'org-thumb' : 'org',
		img
	);
}

/** Simpan foto + thumbnail (nama sama, dua folder). */
export async function saveOrgPhoto(file: string, photo: Buffer, thumb: Buffer): Promise<void> {
	await writeImage('org', file, photo);
	try {
		await writeImage('org-thumb', file, thumb);
	} catch (err) {
		await removeImage('org', file);
		throw err;
	}
}

export async function removeOrgPhoto(file: string): Promise<void> {
	await removeImage('org', file);
	await removeImage('org-thumb', file);
}
