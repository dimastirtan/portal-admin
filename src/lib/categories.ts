/**
 * Kategori yang dipakai portal untuk mengelompokkan data. Nilai = isi kolom DB.
 * Dipakai server (validasi, label) dan form (pilihan).
 */

/** tmlink.C_CTGR_LINK — portal: 1 = External, selain itu = PT DI Internal. */
export const LINK_CATEGORIES = [
	{ value: 1, label: 'External', hint: 'situs di luar PT DI' },
	{ value: 0, label: 'PT DI Internal', hint: 'aplikasi/situs jaringan internal' }
] as const;

/** tmtelp.C_CTGR_TELP — portal hanya menampilkan 0, 1, 2. */
export const TELP_CATEGORIES = [
	{ value: 0, label: 'PT DI', hint: 'extension / nomor internal' },
	{ value: 1, label: 'Bandung', hint: 'nomor lokal Bandung' },
	{ value: 2, label: 'National', hint: 'nomor nasional' }
] as const;
