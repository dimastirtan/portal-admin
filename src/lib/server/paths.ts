import fs from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';

/** Folder unggahan portal (UPLOAD_DIR portal). Kosong = ./dev-uploads untuk uji lokal. */
export const uploadDir = () => path.resolve(env.UPLOAD_DIR || 'dev-uploads');

/** Status folder unggahan untuk beranda. */
export function uploadDirStatus(): { path: string; ok: boolean; note: string } {
	const dir = uploadDir();
	try {
		if (!fs.statSync(dir).isDirectory()) return { path: dir, ok: false, note: 'bukan folder' };
		fs.accessSync(dir, fs.constants.W_OK);
		return { path: dir, ok: true, note: 'bisa ditulis' };
	} catch (err) {
		const code = (err as NodeJS.ErrnoException).code;
		return { path: dir, ok: false, note: code === 'ENOENT' ? 'belum ada' : 'tidak bisa ditulis' };
	}
}
