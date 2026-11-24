/**
 * Modul Link — tabel tmlink, tampil di portal /link (getLinks di portal):
 * diurutkan N_DESC_LINK; C_CTGR_LINK 1 = External, selain itu = PT DI Internal;
 * URL dipakai apa adanya sebagai href (jadi hanya http/https yang diterima).
 */
import { and, asc, count, eq, like, ne, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { link } from '$lib/server/db/schema';
import { columnLimits, limitOf } from '$lib/server/columns';
import { likePattern, PAGE_SIZE } from '$lib/server/list';
import {
	fixText,
	formatDate,
	normalize,
	readText,
	todayJakarta,
	unsupportedChars,
	type Errors
} from '$lib/server/text';
import type { LinkLimits, LinkValues, LinkView } from '$lib/types';

const categoryLabel = (c: number) => (c === 1 ? 'External' : 'PT DI Internal');

export async function linkLimits(): Promise<LinkLimits> {
	const l = await columnLimits('tmlink');
	return {
		desc: limitOf(l, 'N_DESC_LINK', 50),
		url: limitOf(l, 'N_URL_LINK', 50),
		entryBy: limitOf(l, 'I_ENTRY', 10)
	};
}

const toView = (r: typeof link.$inferSelect): LinkView => ({
	id: r.id,
	// Data lama memakai 0 untuk internal; portal menganggap semua selain 1 internal.
	category: r.category === 1 ? 1 : 0,
	categoryLabel: categoryLabel(r.category),
	desc: fixText(r.desc),
	url: (r.url ?? '').trim(),
	entryBy: (r.entryBy ?? '').trim(),
	entryAt: formatDate(r.entryAt)
});

export async function listLinks(opts: { q: string; kat: 0 | 1 | null; offset: number }) {
	const pattern = likePattern(opts.q);
	const where = and(
		opts.q ? or(like(link.desc, pattern), like(link.url, pattern)) : undefined,
		opts.kat === 1 ? eq(link.category, 1) : opts.kat === 0 ? ne(link.category, 1) : undefined
	);
	const [totals, rows] = await Promise.all([
		db.select({ n: count() }).from(link).where(where),
		db
			.select()
			.from(link)
			.where(where)
			.orderBy(asc(link.desc), asc(link.id))
			.limit(PAGE_SIZE)
			.offset(opts.offset)
	]);
	return { total: Number(totals[0]?.n ?? 0), rows: rows.map(toView) };
}

export async function getLink(id: number): Promise<LinkView | null> {
	const [row] = await db.select().from(link).where(eq(link.id, id)).limit(1);
	return row ? toView(row) : null;
}

/** Baca & validasi form link. */
export function readLinkForm(form: FormData, limits: LinkLimits) {
	const errors: Errors = {};
	const rawCategory = String(form.get('category') ?? '');
	if (rawCategory !== '0' && rawCategory !== '1') errors.category = 'Pilih kategori.';

	const desc = readText(
		form,
		'desc',
		{ label: 'Deskripsi', max: limits.desc, required: true },
		errors
	);

	let url = normalize(form.get('url')).replace(/\s+/g, '');
	if (!url) {
		errors.url = 'URL wajib diisi.';
	} else {
		// "www.contoh.go.id" → "http://www.contoh.go.id" (sama dengan data lama).
		if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = `http://${url}`;
		let parsed: URL | null = null;
		try {
			parsed = new URL(url);
		} catch {
			parsed = null;
		}
		if (!parsed || !['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
			errors.url = 'URL tidak valid. Contoh: https://www.indonesian-aerospace.com';
		} else if (unsupportedChars(url).length) {
			errors.url = 'URL berisi karakter yang tidak bisa disimpan di database.';
		} else if (url.length > limits.url) {
			errors.url = `URL maksimal ${limits.url} karakter (sekarang ${url.length}).`;
		}
	}

	const values: LinkValues = { category: rawCategory === '1' ? 1 : 0, desc, url };
	return { values, errors };
}

/** Nilai + kolom audit wajib (I_ENTRY = username, D_ENTRY = hari ini). */
const withEntry = (values: LinkValues, username: string, limits: LinkLimits) => ({
	...values,
	entryBy: username.slice(0, limits.entryBy),
	entryAt: todayJakarta()
});

export async function createLink(values: LinkValues, username: string, limits: LinkLimits) {
	const [row] = await db
		.insert(link)
		.values(withEntry(values, username, limits))
		.$returningId();
	return row.id;
}

/** false bila link sudah tidak ada. */
export async function updateLink(
	id: number,
	values: LinkValues,
	username: string,
	limits: LinkLimits
): Promise<boolean> {
	const [res] = await db
		.update(link)
		.set(withEntry(values, username, limits))
		.where(eq(link.id, id));
	return res.affectedRows > 0;
}

export async function deleteLink(id: number): Promise<boolean> {
	const [res] = await db.delete(link).where(eq(link.id, id));
	return res.affectedRows > 0;
}
