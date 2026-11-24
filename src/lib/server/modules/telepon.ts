/**
 * Modul Telepon penting — tabel tmtelp, tampil di portal /telepon-penting
 * (getTelepon di portal): dikelompokkan C_CTGR_TELP 0 = PT DI, 1 = Bandung,
 * 2 = National (kategori lain tidak tampil), diurutkan N_TITLE_TELP.
 *
 * Nomor berupa teks bebas di data lama ("147 Pilihan 2", "Kd.Wil+108",
 * "5116, 70046129"), jadi divalidasi sebagai teks — cukup wajib memuat angka.
 * Primary key tabel ini (C_TELP, N_TELP), tapi C_TELP auto increment & unik.
 */
import { and, asc, count, eq, like, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { telp } from '$lib/server/db/schema';
import { columnLimits, limitOf } from '$lib/server/columns';
import { likePattern, PAGE_SIZE } from '$lib/server/list';
import { fixText, formatDate, nowJakarta, readText, type Errors } from '$lib/server/text';
import { TELP_CATEGORIES } from '$lib/categories';
import type { TelpLimits, TelpValues, TelpView } from '$lib/types';

const categoryOf = (c: number) => TELP_CATEGORIES.find((x) => x.value === c);

export async function telpLimits(): Promise<TelpLimits> {
	const l = await columnLimits('tmtelp');
	return {
		title: limitOf(l, 'N_TITLE_TELP', 200),
		no: limitOf(l, 'N_TELP', 50),
		entryBy: limitOf(l, 'I_ENTRY', 20)
	};
}

const toView = (r: typeof telp.$inferSelect): TelpView => {
	const cat = categoryOf(r.category);
	return {
		id: r.id,
		category: r.category,
		categoryLabel: cat?.label ?? `Kategori ${r.category}`,
		shown: Boolean(cat),
		title: fixText(r.title),
		no: fixText(r.no),
		entryBy: (r.entryBy ?? '').trim(),
		entryAt: formatDate(r.entryAt)
	};
};

export async function listTelp(opts: { q: string; kat: number | null; offset: number }) {
	const pattern = likePattern(opts.q);
	const where = and(
		opts.q ? or(like(telp.title, pattern), like(telp.no, pattern)) : undefined,
		opts.kat !== null ? eq(telp.category, opts.kat) : undefined
	);
	const [totals, rows] = await Promise.all([
		db.select({ n: count() }).from(telp).where(where),
		db
			.select()
			.from(telp)
			.where(where)
			// Sama dengan portal: per kelompok, lalu abjad nama.
			.orderBy(asc(telp.category), asc(telp.title), asc(telp.id))
			.limit(PAGE_SIZE)
			.offset(opts.offset)
	]);
	return { total: Number(totals[0]?.n ?? 0), rows: rows.map(toView) };
}

export async function getTelp(id: number): Promise<TelpView | null> {
	const [row] = await db.select().from(telp).where(eq(telp.id, id)).limit(1);
	return row ? toView(row) : null;
}

/** Baca & validasi form telepon. */
export function readTelpForm(form: FormData, limits: TelpLimits) {
	const errors: Errors = {};
	const category = Number(form.get('category'));
	if (!categoryOf(category)) errors.category = 'Pilih kelompok.';

	const title = readText(
		form,
		'title',
		{ label: 'Nama', max: limits.title, required: true },
		errors
	);
	const no = readText(form, 'no', { label: 'Nomor', max: limits.no, required: true }, errors);
	if (no && !errors.no && !/\d/.test(no)) errors.no = 'Nomor harus memuat angka.';

	const values: TelpValues = { category: categoryOf(category) ? category : 0, title, no };
	return { values, errors };
}

/** Nilai + kolom audit wajib (I_ENTRY = username, D_ENTRY = sekarang). */
const withEntry = (values: TelpValues, username: string, limits: TelpLimits) => ({
	...values,
	entryBy: username.slice(0, limits.entryBy),
	entryAt: nowJakarta()
});

export async function createTelp(values: TelpValues, username: string, limits: TelpLimits) {
	const [row] = await db
		.insert(telp)
		.values(withEntry(values, username, limits))
		.$returningId();
	return row.id;
}

/** false bila baris sudah tidak ada. */
export async function updateTelp(
	id: number,
	values: TelpValues,
	username: string,
	limits: TelpLimits
): Promise<boolean> {
	const [res] = await db
		.update(telp)
		.set(withEntry(values, username, limits))
		.where(eq(telp.id, id));
	return res.affectedRows > 0;
}

export async function deleteTelp(id: number): Promise<boolean> {
	const [res] = await db.delete(telp).where(eq(telp.id, id));
	return res.affectedRows > 0;
}

/** Ringkasan untuk log audit. */
export const telpSnapshot = ({ category, title, no }: TelpValues) => ({ category, title, no });
