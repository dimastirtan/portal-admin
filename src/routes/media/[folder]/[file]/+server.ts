/**
 * GET /media/<folder>/<file> — pratinjau gambar unggahan di dashboard (di belakang
 * login, lihat hooks.server.ts). Portal menyajikan berkas yang sama lewat /media-nya sendiri.
 */
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import { imageInfo, isUploadFolder } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request }) => {
	if (!isUploadFolder(params.folder)) error(404, 'Not Found');
	const img = imageInfo(params.folder, params.file);
	if (!img) error(404, 'Gambar tidak ditemukan.');

	const etag = `"${img.size.toString(36)}-${img.mtime.getTime().toString(36)}"`;
	const headers: Record<string, string> = {
		'Content-Type': img.type,
		'Cache-Control': 'private, no-cache',
		ETag: etag
	};
	if (request.headers.get('if-none-match') === etag)
		return new Response(null, { status: 304, headers });
	const body = Readable.toWeb(fs.createReadStream(img.full)) as ReadableStream;
	return new Response(body, { headers: { ...headers, 'Content-Length': String(img.size) } });
};
