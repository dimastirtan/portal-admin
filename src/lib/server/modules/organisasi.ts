/**
 * Modul Struktur organisasi — tmorg (unit: C_TYPE_ORG 0 = pimpinan, 1 = pusat/divisi)
 * + tmorgdet (departemen per unit) + foto pejabat. Cara portal membacanya
 * (getOrgStructure / orgPhoto):
 *  - unit urut C_TYPE_ORG lalu C_ORG; departemen urut C_ORG_DET; departemen tanpa
 *    jabatan & tanpa pejabat disembunyikan; departemen yang unitnya sudah tidak ada
 *    (data lama) tidak ikut;
 *  - nama pejabat dari tmemp lewat NIK (tmorg.C_NIK_ORG varchar, tmorgdet.C_NIK_ORG_DET
 *    int → NIK berawalan 0 tidak bisa disimpan di departemen);
 *  - foto: UPLOAD_DIR/org-thumb/<nama> → UPLOAD_DIR/org/<nama> → foto lama di static;
 *    kolom kosong atau "blank.jpg" = tanpa foto.
 *
 * Foto baru diberi nama unik (lihat newOrgPhotoName) dan ditulis ke disk SEBELUM DB,
 * jadi portal tidak pernah merujuk berkas yang belum ada; foto unggahan lama dihapus
 * setelah tidak dirujuk baris mana pun.
 */
import { and, asc, count, eq, ne, notInArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emp, org, orgDet } from '$lib/server/db/schema';
import { columnLimits, limitOf } from '$lib/server/columns';
import { PRESETS, orgThumbnail, processImage, uploadedFile } from '$lib/server/images';
import {
	isUploadedOrgPhoto,
	newOrgPhotoName,
	orgPhotoPreview,
	removeOrgPhoto,
	saveOrgPhoto
} from '$lib/server/uploads';
import { portalLink } from '$lib/server/portal-url';
import { dbErrorMessage } from '$lib/server/db-error';
import { fixText, formatDate, nowJakarta, readText, type Errors } from '$lib/server/text';
import type {
	EmployeeOption,
	OrgDeptValues,
	OrgDeptView,
	OrgLimits,
	OrgPhoto,
	OrgUnitValues,
	OrgUnitView
} from '$lib/types';

export async function orgLimits(): Promise<OrgLimits> {
	const [u, d] = await Promise.all([columnLimits('tmorg'), columnLimits('tmorgdet')]);
	return {
		unitTitle: limitOf(u, 'N_TITLE_ORG', 200),
		deptTitle: limitOf(d, 'N_TITLE_ORG_DET', 200)
	};
}

// ── Pegawai (tmemp — hanya C_NIK & I_EMP yang dibaca) ─────────────────────────

let empCache: { at: number; list: EmployeeOption[]; byNik: Map<string, string> } | null = null;

export async function employees() {
	if (empCache && Date.now() - empCache.at < 10 * 60_000) return empCache;
	const rows = await db.select({ nik: emp.nik, name: emp.name }).from(emp);
	const list = rows
		.map((r) => ({ nik: (r.nik ?? '').trim(), name: fixText(r.name) }))
		.filter((e) => /^\d{5,6}$/.test(e.nik) && e.name)
		.sort((a, b) => a.name.localeCompare(b.name, 'id'));
	empCache = { at: Date.now(), list, byNik: new Map(list.map((e) => [e.nik, e.name])) };
	return empCache;
}

// ── Foto ─────────────────────────────────────────────────────────────────────

const isEmptyPhoto = (f: string) => !f || f.toLowerCase() === 'blank.jpg';

function photoView(raw: string | null): OrgPhoto {
	const file = (raw ?? '').trim();
	if (isEmptyPhoto(file)) return { file: '', kind: '', preview: null, legacyUrl: null };
	const preview = orgPhotoPreview(file);
	if (preview) return { file, kind: 'upload', preview, legacyUrl: null };
	return {
		file,
		kind: 'lama',
		preview: null,
		legacyUrl: portalLink(`/gambar/org/${encodeURIComponent(file)}`)
	};
}

/** Foto dari form → { file, photo, thumb } siap simpan, atau pesan galat di errors.foto. */
export async function readOrgPhoto(form: FormData, errors: Errors) {
	const file = uploadedFile(form, 'foto');
	if (!file) return { image: null, hadFile: false };
	const result = await processImage(file, PRESETS.org);
	if (!result.ok) {
		errors.foto = result.error;
		return { image: null, hadFile: true };
	}
	const thumb = await orgThumbnail(result.image.data);
	const short = Math.min(result.image.width, result.image.height);
	const warnings =
		short < 168
			? [`Foto kecil (${result.image.width}×${result.image.height} px) — bisa tampak buram.`]
			: [];
	return { image: { data: result.image.data, thumb, warnings }, hadFile: true };
}

/** Berapa baris (unit + departemen) yang merujuk nama foto ini. */
async function photoRefs(file: string): Promise<number> {
	const [[a], [b]] = await Promise.all([
		db.select({ n: count() }).from(org).where(eq(org.foto, file)),
		db.select({ n: count() }).from(orgDet).where(eq(orgDet.foto, file))
	]);
	return Number(a?.n ?? 0) + Number(b?.n ?? 0);
}

/** Hapus foto unggahan lama bila tidak dirujuk lagi (foto lama di static tidak disentuh). */
export async function cleanupPhoto(file: string): Promise<boolean> {
	if (isEmptyPhoto(file) || !isUploadedOrgPhoto(file)) return false;
	if ((await photoRefs(file)) > 0) return false;
	try {
		await removeOrgPhoto(file);
		return true;
	} catch (err) {
		console.error(`[organisasi] foto ${file} gagal dihapus:`, err);
		return false;
	}
}

/**
 * Simpan unit/departemen beserta fotonya, berurutan:
 *  1. foto baru ditulis ke disk (galat → DB tidak disentuh);
 *  2. baris DB ditulis lewat `write(foto)` (galat → foto baru dihapus lagi);
 *  3. foto unggahan lama dihapus bila tidak dirujuk baris lain.
 */
export async function saveWithPhoto<T>(opts: {
	current: string;
	nik: string;
	/** Awal nama berkas bila tanpa NIK, mis. "unit" / "dept". */
	fallback: string;
	image: { data: Buffer; thumb: Buffer } | null;
	remove: boolean;
	context: string;
	write: (foto: string) => Promise<T>;
}): Promise<{ ok: true; result: T; foto: string } | { ok: false; error: string }> {
	let foto = opts.remove ? '' : opts.current;
	let written: string | null = null;
	if (opts.image) {
		written = newOrgPhotoName(opts.nik, opts.fallback);
		try {
			await saveOrgPhoto(written, opts.image.data, opts.image.thumb);
		} catch (err) {
			console.error(`[organisasi] foto ${opts.context} gagal disimpan:`, err);
			return {
				ok: false,
				error: 'Foto gagal disimpan ke folder unggahan (UPLOAD_DIR). Periksa folder & hak tulisnya.'
			};
		}
		foto = written;
	}
	let result: T;
	try {
		result = await opts.write(foto);
	} catch (err) {
		if (written) await removeOrgPhoto(written).catch(() => {});
		return { ok: false, error: dbErrorMessage(err, opts.context) };
	}
	if (opts.current && opts.current !== foto) await cleanupPhoto(opts.current);
	return { ok: true, result, foto };
}

// ── NIK ──────────────────────────────────────────────────────────────────────

/**
 * NIK pejabat dari <select>: '' = tanpa pejabat. NIK yang tidak ada di tmemp hanya
 * boleh bila sama dengan nilai yang sudah tersimpan (data lama, pegawai sudah keluar).
 */
export async function readNik(
	form: FormData,
	errors: Errors,
	opts: { current?: string; numeric?: boolean } = {}
): Promise<string> {
	const nik = String(form.get('nik') ?? '').trim();
	if (!nik) return '';
	if (!/^\d{5,6}$/.test(nik)) {
		errors.nik = 'Pilih pejabat dari daftar.';
		return nik;
	}
	const { byNik } = await employees();
	if (!byNik.has(nik) && nik !== opts.current) {
		errors.nik = `NIK ${nik} tidak ada di data pegawai.`;
	} else if (opts.numeric && nik.startsWith('0')) {
		errors.nik = 'NIK berawalan 0 tidak bisa disimpan untuk departemen (kolom angka).';
	}
	return nik;
}

// ── Baca ─────────────────────────────────────────────────────────────────────

const deptView = (d: typeof orgDet.$inferSelect, byNik: Map<string, string>): OrgDeptView => {
	const nik = d.nik ? String(d.nik) : '';
	const title = fixText(d.title);
	const head = byNik.get(nik) ?? '';
	return {
		id: d.id,
		orgId: d.orgId,
		title,
		nik,
		head,
		headMissing: Boolean(nik) && !head,
		visible: Boolean(title || head),
		foto: photoView(d.foto),
		entryBy: (d.entryBy ?? '').trim(),
		entryAt: formatDate(d.entryAt)
	};
};

const unitView = (
	u: typeof org.$inferSelect,
	byNik: Map<string, string>,
	departments: OrgDeptView[]
): OrgUnitView => {
	const nik = (u.nik ?? '').trim();
	const head = byNik.get(nik) ?? '';
	return {
		id: u.id,
		title: fixText(u.title),
		type: u.type === 0 ? 0 : 1,
		nik,
		head,
		headMissing: Boolean(nik) && !head,
		foto: photoView(u.foto),
		entryBy: (u.entryBy ?? '').trim(),
		entryAt: formatDate(u.entryAt),
		departments
	};
};

export async function listUnits(): Promise<OrgUnitView[]> {
	const [units, dets, { byNik }] = await Promise.all([
		db.select().from(org).orderBy(asc(org.type), asc(org.id)),
		db.select().from(orgDet).orderBy(asc(orgDet.id)),
		employees()
	]);
	return units.map((u) =>
		unitView(
			u,
			byNik,
			dets.filter((d) => d.orgId === u.id).map((d) => deptView(d, byNik))
		)
	);
}

export async function getUnit(id: number): Promise<OrgUnitView | null> {
	const [u] = await db.select().from(org).where(eq(org.id, id)).limit(1);
	if (!u) return null;
	const [dets, { byNik }] = await Promise.all([
		db.select().from(orgDet).where(eq(orgDet.orgId, id)).orderBy(asc(orgDet.id)),
		employees()
	]);
	return unitView(
		u,
		byNik,
		dets.map((d) => deptView(d, byNik))
	);
}

export async function getDept(orgId: number, id: number): Promise<OrgDeptView | null> {
	const [d] = await db
		.select()
		.from(orgDet)
		.where(and(eq(orgDet.id, id), eq(orgDet.orgId, orgId)))
		.limit(1);
	if (!d) return null;
	return deptView(d, (await employees()).byNik);
}

/** Departemen lama yang unitnya sudah tidak ada (portal tidak menampilkannya). */
export async function orphanDeptCount(): Promise<number> {
	const ids = (await db.select({ id: org.id }).from(org)).map((u) => u.id);
	const [row] = await db
		.select({ n: count() })
		.from(orgDet)
		.where(ids.length ? notInArray(orgDet.orgId, ids) : undefined);
	return Number(row?.n ?? 0);
}

export async function unitOptions() {
	const rows = await db
		.select({ id: org.id, title: org.title, type: org.type })
		.from(org)
		.orderBy(asc(org.type), asc(org.id));
	return rows.map((r) => ({ id: r.id, title: fixText(r.title) || `Unit #${r.id}` }));
}

// ── Form ─────────────────────────────────────────────────────────────────────

export async function readUnitForm(
	form: FormData,
	limits: OrgLimits,
	opts: { id?: number; currentNik?: string } = {}
) {
	const errors: Errors = {};
	const title = readText(
		form,
		'title',
		{ label: 'Nama unit', max: limits.unitTitle, required: true },
		errors
	);
	const rawType = String(form.get('type') ?? '');
	const type = rawType === '0' ? 0 : 1;
	if (rawType !== '0' && rawType !== '1') errors.type = 'Pilih jenis unit.';
	if (type === 0) {
		// Portal menaruh unit pimpinan di puncak bagan — cukup satu.
		const [other] = await db
			.select({ id: org.id, title: org.title })
			.from(org)
			.where(opts.id ? and(eq(org.type, 0), ne(org.id, opts.id)) : eq(org.type, 0))
			.limit(1);
		if (other)
			errors.type = `Sudah ada unit pimpinan: “${fixText(other.title)}”. Hanya boleh satu.`;
	}
	const nik = await readNik(form, errors, { current: opts.currentNik });
	const values: OrgUnitValues = { title, type, nik };
	return { values, errors };
}

export async function readDeptForm(
	form: FormData,
	limits: OrgLimits,
	opts: { currentNik?: string } = {}
) {
	const errors: Errors = {};
	const title = readText(
		form,
		'title',
		{ label: 'Nama departemen', max: limits.deptTitle, required: true },
		errors
	);
	const nik = await readNik(form, errors, { current: opts.currentNik, numeric: true });
	const orgId = Number(form.get('orgId'));
	const [unit] = Number.isInteger(orgId)
		? await db.select({ id: org.id }).from(org).where(eq(org.id, orgId)).limit(1)
		: [];
	if (!unit) errors.orgId = 'Unit tidak ditemukan.';
	const values: OrgDeptValues = { title, nik, orgId };
	return { values, errors };
}

// ── Simpan / hapus ───────────────────────────────────────────────────────────

const entry = (username: string) => ({ entryBy: username.slice(0, 100), entryAt: nowJakarta() });

export async function createUnit(v: OrgUnitValues, foto: string, username: string) {
	const [row] = await db
		.insert(org)
		.values({ title: v.title, type: v.type, nik: v.nik, foto, ...entry(username) })
		.$returningId();
	return row.id;
}

export async function updateUnit(id: number, v: OrgUnitValues, foto: string, username: string) {
	await db
		.update(org)
		.set({ title: v.title, type: v.type, nik: v.nik, foto, ...entry(username) })
		.where(eq(org.id, id));
}

export async function deleteUnit(id: number) {
	await db.delete(org).where(eq(org.id, id));
}

export async function createDept(v: OrgDeptValues, foto: string, username: string) {
	const [row] = await db
		.insert(orgDet)
		.values({
			orgId: v.orgId,
			title: v.title,
			nik: v.nik ? Number(v.nik) : 0,
			foto,
			...entry(username)
		})
		.$returningId();
	return row.id;
}

export async function updateDept(id: number, v: OrgDeptValues, foto: string, username: string) {
	await db
		.update(orgDet)
		.set({
			orgId: v.orgId,
			title: v.title,
			nik: v.nik ? Number(v.nik) : 0,
			foto,
			...entry(username)
		})
		.where(eq(orgDet.id, id));
}

export async function deleteDept(id: number) {
	await db.delete(orgDet).where(eq(orgDet.id, id));
}

/** Ringkasan untuk log audit. */
export const orgSnapshot = (
	v: { title: string; nik: string; type?: number; orgId?: number },
	foto?: string
) => ({
	title: v.title,
	nik: v.nik,
	...(v.type !== undefined ? { type: v.type } : {}),
	...(v.orgId !== undefined ? { orgId: v.orgId } : {}),
	...(foto !== undefined ? { foto } : {})
});
