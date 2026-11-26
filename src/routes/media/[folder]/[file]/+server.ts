/**
 * GET /media/<folder>/<file> — pratinjau gambar unggahan di dashboard (di belakang
 * login, lihat hooks.server.ts). Portal menyajikan berkas yang sama lewat /media-nya sendiri.
 *
 * ?w=240 → thumbnail kecil untuk daftar (dibuat saat diminta; browser cukup menerima
 * 304 selama berkasnya tidak berubah, jadi tidak diolah ulang tiap kali halaman dibuka).
 */
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import { previewThumbnail } from '$lib/server/images';
import { imageInfo, isUploadFolder, THUMB_SIDE } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request, url }) => {
	if (!isUploadFolder(params.folder)) error(404, 'Not Found');
	const img = imageInfo(params.folder, params.file);
	if (!img) error(404, 'Gambar tidak ditemukan.');

	const thumb = url.searchParams.get('w') === String(THUMB_SIDE);
	const version = `${img.size.toString(36)}-${img.mtime.getTime().toString(36)}`;
	const etag = thumb ? `"t${THUMB_SIDE}-${version}"` : `"${version}"`;
	const headers: Record<string, string> = {
		'Content-Type': thumb ? 'image/webp' : img.type,
		'Cache-Control': 'private, no-cache',
		ETag: etag
	};
	if (request.headers.get('if-none-match') === etag)
		return new Response(null, { status: 304, headers });

	if (thumb) {
		let data: Buffer;
		try {
			data = await previewThumbnail(img.full, THUMB_SIDE);
		} catch (err) {
			console.error(`[media] thumbnail ${params.folder}/${params.file} gagal:`, err);
			error(500, 'Thumbnail gagal dibuat.');
		}
		return new Response(new Uint8Array(data), {
			headers: { ...headers, 'Content-Length': String(data.length) }
		});
	}

	const body = Readable.toWeb(fs.createReadStream(img.full)) as ReadableStream;
	return new Response(body, { headers: { ...headers, 'Content-Length': String(img.size) } });
};
