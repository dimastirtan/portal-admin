/**
 * Modul Headline — tmmainarticledet (satu baris = satu headline) + tmmainarticle
 * (berita induk). Cara portal membacanya (getHeadlines):
 *  - urut d_mainarticle ↓ lalu id ↓; baris tanpa judul/isi disembunyikan;
 *    5 teratas = slideshow hero beranda; detail di /berita-utama/<id>;
 *  - isi tanpa tag HTML = teks polos, tiap baris jadi paragraf; baris pertama yang
 *    sama dengan judul dibuang; isi ber-HTML dibersihkan (cleanRichHtml);
 *  - gambar: UPLOAD_DIR/headline/<id>.webp → <img> pertama di isi → gambar induk;
 *  - "Part of: <judul induk>" di detail bila judul induk berbeda dari judul headline.
 *
 * Induk hampir selalu 1:1 dengan headline, jadi bawaannya induk dibuat otomatis
 * (judul & tanggal sama) dan ikut diperbarui selama masih "kembar" dengan headline-nya.
 * Induk yang tidak punya headline lagi dihapus — portal tidak pernah menampilkannya.
 * Tabel MyISAM (tanpa transaksi): langkah yang gagal di tengah dikompensasi manual.
 */
import { count, desc, eq, like, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { mainArticle, mainArticleDet } from '$lib/server/db/schema';
import { columnLimits, limitOf } from '$lib/server/columns';
import { likePattern, PAGE_SIZE } from '$lib/server/list';
import { deleteHeadlineImages, headlineImageIds, saveHeadlineImage } from '$lib/server/uploads';
import { PRESETS, processImage, uploadedFile, type ProcessedImage } from '$lib/server/images';
import type { FlashMessage } from '$lib/server/cookies';
import { fixText, formatDate, readText, todayJakarta, type Errors } from '$lib/server/text';
import type {
	HeadlineLimits,
	HeadlineRow,
	HeadlineValues,
	ParentOption,
	TextFormat
} from '$lib/types';

const det = mainArticleDet;
const MAX_TEXT = 100_000;

/** Sama dengan portal: ada tag HTML → isi diperlakukan sebagai HTML. */
export const isPlainText = (s: string) => !/<\/?[a-z][^>]*>/i.test(s);

const VISIBLE = sql<number>`(TRIM(${det.judul}) <> '' AND TRIM(${det.teks}) <> '')`;
const HAS_IMG = sql<number>`(${det.teks} LIKE '%<img%')`;

export async function headlineLimits(): Promise<HeadlineLimits> {
	const [d, p] = await Promise.all([
		columnLimits('tmmainarticledet'),
		columnLimits('tmmainarticle')
	]);
	// Judul headline juga dipakai sebagai judul induk otomatis → harus muat di keduanya.
	return {
		title: Math.min(limitOf(d, 'n_judul_mainarticle', 100), limitOf(p, 'n_judul_mainarticle', 100))
	};
}

// ── Daftar ───────────────────────────────────────────────────────────────────

export async function listHeadlines(opts: { q: string; offset: number }) {
	const where = opts.q ? like(det.judul, likePattern(opts.q)) : undefined;
	const [totals, rows, heroRows] = await Promise.all([
		db.select({ n: count() }).from(det).where(where),
		db
			.select({
				id: det.id,
				date: det.date,
				judul: det.judul,
				visible: VISIBLE,
				hasImg: HAS_IMG,
				parentTitle: mainArticle.judul,
				parentDate: mainArticle.date,
				parentImage: mainArticle.image
			})
			.from(det)
			.leftJoin(mainArticle, eq(det.parentId, mainArticle.id))
			.where(where)
			.orderBy(desc(det.date), desc(det.id))
			.limit(PAGE_SIZE)
			.offset(opts.offset),
		db
			.select({ id: det.id })
			.from(det)
			.where(VISIBLE)
			.orderBy(desc(det.date), desc(det.id))
			.limit(5)
	]);
	const hero = new Map(heroRows.map((r, i) => [r.id, i + 1]));
	const uploaded = headlineImageIds();
	return {
		total: Number(totals[0]?.n ?? 0),
		rows: rows.map((r): HeadlineRow => ({
			id: r.id,
			title: fixText(r.judul),
			date: formatDate(r.date) || formatDate(r.parentDate),
			parentTitle: fixText(r.parentTitle),
			image: uploaded.has(r.id)
				? 'upload'
				: Number(r.hasImg)
					? 'isi'
					: (r.parentImage ?? '').trim()
						? 'induk'
						: '',
			hero: hero.get(r.id) ?? 0,
			visible: Boolean(Number(r.visible))
		}))
	};
}

export async function listParents(): Promise<ParentOption[]> {
	const rows = await db
		.select({
			id: mainArticle.id,
			judul: mainArticle.judul,
			date: mainArticle.date,
			children: sql<number>`COUNT(${det.id})`
		})
		.from(mainArticle)
		.leftJoin(det, eq(det.parentId, mainArticle.id))
		.groupBy(mainArticle.id, mainArticle.judul, mainArticle.date)
		.orderBy(desc(mainArticle.date), desc(mainArticle.id));
	return rows.map((r) => ({
		id: r.id,
		title: fixText(r.judul) || `(induk #${r.id} tanpa judul)`,
		date: formatDate(r.date),
		children: Number(r.children)
	}));
}

const childCount = async (parentId: number) =>
	Number((await db.select({ n: count() }).from(det).where(eq(det.parentId, parentId)))[0]?.n ?? 0);

export async function parentExists(id: number): Promise<boolean> {
	const [row] = await db
		.select({ id: mainArticle.id })
		.from(mainArticle)
		.where(eq(mainArticle.id, id))
		.limit(1);
	return Boolean(row);
}

// ── Satu headline ────────────────────────────────────────────────────────────

export async function getHeadline(id: number) {
	const [r] = await db
		.select({
			id: det.id,
			parentId: det.parentId,
			date: det.date,
			judul: det.judul,
			teks: det.teks,
			parentTitle: mainArticle.judul,
			parentDate: mainArticle.date,
			parentImage: mainArticle.image
		})
		.from(det)
		.leftJoin(mainArticle, eq(det.parentId, mainArticle.id))
		.where(eq(det.id, id))
		.limit(1);
	if (!r) return null;
	return {
		id: r.id,
		parentId: r.parentId,
		parentTitle: fixText(r.parentTitle),
		/** Judul induk apa adanya (untuk membandingkan "kembar"). */
		parentRawTitle: r.parentTitle ?? '',
		parentImage: (r.parentImage ?? '').trim(),
		parentChildren: r.parentId ? await childCount(r.parentId) : 0,
		title: fixText(r.judul),
		rawTitle: r.judul ?? '',
		date: isoDate(r.date) || isoDate(r.parentDate),
		text: r.teks ?? '',
		isHtml: !isPlainText(r.teks ?? ''),
		hasImg: /<img\b/i.test(r.teks ?? '')
	};
}

export type Headline = NonNullable<Awaited<ReturnType<typeof getHeadline>>>;

/** Nilai form untuk mengubah headline; `plain` = ubah isi HTML lama jadi teks polos. */
export function editableValues(h: Headline, plain: boolean): HeadlineValues {
	const format: TextFormat = h.isHtml && !plain ? 'html' : 'text';
	return {
		title: h.title,
		date: h.date || todayJakarta(),
		text: h.isHtml ? (plain ? htmlToText(h.text) : fixText(h.text)) : fromStoredText(h.text),
		format,
		parent: h.parentId ? String(h.parentId) : 'baru'
	};
}

// ── Form ─────────────────────────────────────────────────────────────────────

const isoDate = (v: string | null | undefined) => {
	const d = /^(\d{4}-\d{2}-\d{2})/.exec(v ?? '')?.[1];
	return d && d !== '0000-00-00' ? d : '';
};

function validDate(s: string): boolean {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (!m) return false;
	const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const date = new Date(Date.UTC(y, mo - 1, d));
	return y >= 1990 && y <= 2100 && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

export function readHeadlineForm(form: FormData, limits: HeadlineLimits) {
	const errors: Errors = {};
	const title = readText(
		form,
		'title',
		{ label: 'Judul', max: limits.title, required: true },
		errors
	);
	const date = String(form.get('date') ?? '').trim();
	if (!validDate(date)) errors.date = 'Isi tanggal yang valid.';
	const format: TextFormat = form.get('format') === 'html' ? 'html' : 'text';
	const text = readText(
		form,
		'text',
		{ label: 'Isi berita', max: MAX_TEXT, required: true, multiline: true },
		errors
	);
	const rawParent = String(form.get('parent') ?? 'baru');
	const parent = /^\d{1,9}$/.test(rawParent) ? rawParent : 'baru';
	const values: HeadlineValues = { title, date, text, format, parent };
	return { values, errors };
}

/**
 * Teks polos disimpan dengan < dan > di-escape: tanpa itu "a <b> c" dianggap HTML
 * oleh portal dan baris baru tidak lagi jadi paragraf. Portal membiarkan entity.
 */
const toStored = (v: HeadlineValues) =>
	v.format === 'text' ? v.text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : v.text;

const fromStoredText = (s: string) => fixText(s.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	hellip: '…',
	mdash: '—',
	ndash: '–',
	lsquo: '‘',
	rsquo: '’',
	ldquo: '“',
	rdquo: '”',
	bull: '•'
};

/** HTML data lama → teks polos (paragraf dipisah baris kosong). */
export function htmlToText(html: string): string {
	let s = html
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<(style|script|xml|head)\b[\s\S]*?<\/\1>/gi, '')
		.replace(/\s+/g, ' ')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<li\b[^>]*>/gi, '\n• ')
		.replace(/<\/(p|div|h[1-6]|li|tr|table|blockquote|ul|ol)>/gi, '\n\n')
		.replace(/<[^>]+>/g, '');
	s = s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
		if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
		const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
		return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
	});
	return fixText(s)
		.split('\n')
		.map((line) => line.replace(/[ \t\xA0]+/g, ' ').trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/** Gambar dari form (opsional), sudah dikecilkan; pesan galat masuk ke `errors.gambar`. */
export async function readHeadlineImage(form: FormData, errors: Errors) {
	const file = uploadedFile(form, 'gambar');
	if (!file) return { image: null, hadFile: false };
	const result = await processImage(file, PRESETS.headline);
	if (!result.ok) errors.gambar = result.error;
	return { image: result.ok ? result.image : null, hadFile: true };
}

/** Simpan gambar headline; galat tidak membatalkan headline yang sudah tersimpan. */
export async function storeHeadlineImage(
	id: number,
	image: ProcessedImage
): Promise<FlashMessage[]> {
	try {
		await saveHeadlineImage(id, image.data);
		return image.warnings.map((text) => ({ type: 'warn' as const, text }));
	} catch (err) {
		console.error(`[headline] gambar #${id} gagal disimpan:`, err);
		return [
			{
				type: 'error',
				text: 'Headline tersimpan, tetapi gambar gagal disimpan ke folder unggahan (UPLOAD_DIR). Coba unggah ulang.'
			}
		];
	}
}

// ── Simpan / hapus ───────────────────────────────────────────────────────────

async function createParent(v: HeadlineValues): Promise<number> {
	const [p] = await db
		.insert(mainArticle)
		.values({ date: v.date, judul: v.title, image: '' })
		.$returningId();
	return p.id;
}

const deleteParent = (id: number) => db.delete(mainArticle).where(eq(mainArticle.id, id));

export async function createHeadline(v: HeadlineValues) {
	const createdParent = v.parent === 'baru';
	const parentId = createdParent ? await createParent(v) : Number(v.parent);
	try {
		const [row] = await db
			.insert(det)
			.values({ parentId, date: v.date, judul: v.title, teks: toStored(v) })
			.$returningId();
		return { id: row.id, parentId, createdParent };
	} catch (err) {
		if (createdParent) await deleteParent(parentId).catch(() => {});
		throw err;
	}
}

/** Mengembalikan catatan untuk admin (mis. induk lama ikut dihapus). */
export async function updateHeadline(id: number, v: HeadlineValues, before: Headline) {
	const notes: string[] = [];
	const createdParent = v.parent === 'baru';
	const parentId = createdParent ? await createParent(v) : Number(v.parent);
	try {
		await db
			.update(det)
			.set({ parentId, date: v.date, judul: v.title, teks: toStored(v) })
			.where(eq(det.id, id));
	} catch (err) {
		if (createdParent) await deleteParent(parentId).catch(() => {});
		throw err;
	}

	const oldParent = before.parentId;
	if (oldParent && oldParent === parentId) {
		// Induk "kembar" (judul sama dengan headline, satu-satunya anak) ikut diperbarui
		// supaya portal tidak menampilkan "Part of: <judul lama>".
		const twin = fixText(before.parentRawTitle) === before.title && before.parentChildren === 1;
		if (twin) {
			await db
				.update(mainArticle)
				.set({ judul: v.title, date: v.date })
				.where(eq(mainArticle.id, parentId));
		}
	} else if (oldParent && (await childCount(oldParent)) === 0) {
		await deleteParent(oldParent);
		notes.push(
			`Berita induk lama “${before.parentTitle || `#${oldParent}`}” dihapus karena tidak punya headline lagi.`
		);
	}
	return { parentId, createdParent, notes };
}

export async function deleteHeadline(h: Headline) {
	await db.delete(det).where(eq(det.id, h.id));
	const images = await deleteHeadlineImages(h.id);
	let parentDeleted = false;
	if (h.parentId && (await childCount(h.parentId)) === 0) {
		await deleteParent(h.parentId);
		parentDeleted = true;
	}
	return { images, parentDeleted };
}

/** Ringkasan untuk log audit (isi berita tidak ikut — cukup panjangnya). */
export const headlineSnapshot = (v: {
	title: string;
	date: string;
	text: string;
	format?: TextFormat;
	parent?: string;
}) => ({
	title: v.title,
	date: v.date,
	format: v.format ?? (isPlainText(v.text) ? 'text' : 'html'),
	textLength: v.text.length,
	...(v.parent ? { parent: v.parent } : {})
});
