/**
 * Tabel modul dashboard di database `dittek` (skema warisan portal PHP, MyISAM,
 * latin1 — tanpa transaksi & foreign key). Dicocokkan dengan SHOW CREATE TABLE
 * 2026-11-24. Panjang varchar di sini hanya keterangan: batas sebenarnya dibaca
 * dari information_schema saat berjalan (lihat $lib/server/columns.ts), supaya
 * kolom yang dilebarkan (ALTER TABLE) langsung terpakai tanpa ubah kode.
 *
 * Kolom audit I_ENTRY/D_ENTRY NOT NULL dan sql_mode server memuat NO_ZERO_DATE —
 * selalu isi keduanya (username admin & waktu sekarang).
 */
import { mysqlTable, int, varchar, date, datetime, longtext } from 'drizzle-orm/mysql-core';

/** Link — portal /link. C_CTGR_LINK 1 = External, selain itu = PT DI Internal. */
export const link = mysqlTable('tmlink', {
	id: int('C_LINK').primaryKey().autoincrement(),
	category: int('C_CTGR_LINK').notNull().default(0),
	desc: varchar('N_DESC_LINK', { length: 50 }).notNull().default(''),
	url: varchar('N_URL_LINK', { length: 50 }).notNull().default(''),
	entryBy: varchar('I_ENTRY', { length: 10 }).notNull().default(''),
	entryAt: date('D_ENTRY', { mode: 'string' }).notNull()
});

/**
 * Telepon penting — portal /telepon-penting. C_CTGR_TELP 0 = PT DI, 1 = Bandung,
 * 2 = National. Primary key aslinya (C_TELP, N_TELP), tapi C_TELP unik.
 */
export const telp = mysqlTable('tmtelp', {
	id: int('C_TELP').primaryKey().autoincrement(),
	title: varchar('N_TITLE_TELP', { length: 200 }).notNull().default(''),
	no: varchar('N_TELP', { length: 50 }).notNull().default(''),
	category: int('C_CTGR_TELP').notNull().default(0),
	entryBy: varchar('I_ENTRY', { length: 20 }).notNull().default(''),
	entryAt: datetime('D_ENTRY', { mode: 'string' }).notNull()
});

/** Berita induk headline (tanpa kolom audit). */
export const mainArticle = mysqlTable('tmmainarticle', {
	id: int('c_mainarticle').primaryKey().autoincrement(),
	date: date('d_mainarticle', { mode: 'string' }).notNull(),
	judul: varchar('n_judul_mainarticle', { length: 100 }).notNull().default(''),
	image: varchar('n_image_mainarticle', { length: 100 }).notNull().default('')
});

/** Satu baris = satu headline (tanpa kolom audit). */
export const mainArticleDet = mysqlTable('tmmainarticledet', {
	id: int('c_mainarticle_detail').primaryKey().autoincrement(),
	parentId: int('c_mainarticle'),
	date: date('d_mainarticle', { mode: 'string' }),
	judul: varchar('n_judul_mainarticle', { length: 100 }).notNull().default(''),
	teks: longtext('n_text_mainarticle').notNull()
});

/** Unit organisasi — C_TYPE_ORG 0 = pimpinan, 1 = divisi. */
export const org = mysqlTable('tmorg', {
	id: int('C_ORG').primaryKey().autoincrement(),
	title: varchar('N_TITLE_ORG', { length: 200 }).notNull().default(''),
	type: int('C_TYPE_ORG').notNull().default(0),
	nik: varchar('C_NIK_ORG', { length: 200 }).notNull().default(''),
	foto: varchar('N_FOTO_ORG', { length: 100 }).notNull().default(''),
	entryBy: varchar('I_ENTRY', { length: 100 }).notNull().default(''),
	entryAt: datetime('D_ENTRY', { mode: 'string' }).notNull()
});

/** Departemen di bawah unit. C_NIK_ORG_DET bertipe int (NIK tanpa nol di depan). */
export const orgDet = mysqlTable('tmorgdet', {
	orgId: int('C_ORG').notNull().default(0),
	id: int('C_ORG_DET').primaryKey().autoincrement(),
	title: varchar('N_TITLE_ORG_DET', { length: 200 }).notNull().default(''),
	nik: int('C_NIK_ORG_DET').notNull().default(0),
	foto: varchar('N_FOTO_ORG_DET', { length: 100 }).notNull().default(''),
	entryBy: varchar('I_ENTRY', { length: 100 }).notNull().default(''),
	entryAt: datetime('D_ENTRY', { mode: 'string' }).notNull()
});

/** Pegawai — baca saja, dan hanya kolom ini (hak SELECT per kolom). */
export const emp = mysqlTable('tmemp', {
	nik: varchar('C_NIK', { length: 6 }).primaryKey(),
	name: varchar('I_EMP', { length: 100 }),
	org: varchar('C_ORG', { length: 8 }),
	status: varchar('C_STATUS', { length: 10 })
});
