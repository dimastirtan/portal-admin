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

/** URL pratinjau di dashboard (lihat src/routes/media), dengan ?v= agar tidak memakai cache lama. */
export const previewUrl = (folder: UploadFolder, img: StoredImage) =>
	`/media/${folder}/${encodeURIComponent(img.file)}?v=${img.mtime.getTime().toString(36)}`;

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
