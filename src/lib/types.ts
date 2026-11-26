/** Tipe yang dipakai server & komponen (tanpa import $lib/server di komponen). */

export type Paging = { page: number; pages: number; total: number; size: number };

export type LinkValues = { category: number; desc: string; url: string };

export type LinkView = LinkValues & {
	id: number;
	categoryLabel: string;
	entryBy: string;
	entryAt: string;
};

export type LinkLimits = { desc: number; url: number; entryBy: number };

export type TelpValues = { category: number; title: string; no: string };

export type TelpView = TelpValues & {
	id: number;
	categoryLabel: string;
	/** false bila kategori di luar 0–2 (data lama) — baris itu tidak tampil di portal. */
	shown: boolean;
	entryBy: string;
	entryAt: string;
};

export type TelpLimits = { title: number; no: number; entryBy: number };

/**
 * Isi headline: 'text' = teks polos (tiap baris jadi paragraf di portal),
 * 'html' = HTML data lama (dibersihkan portal dengan cleanRichHtml).
 */
export type TextFormat = 'text' | 'html';

export type HeadlineValues = {
	title: string;
	/** 'YYYY-MM-DD' */
	date: string;
	text: string;
	format: TextFormat;
	/** 'baru' = buat berita induk otomatis, atau id induk. */
	parent: string;
};

/** Dari mana portal mengambil gambar headline (urutan portal). */
export type ImageSource = 'upload' | 'isi' | 'induk' | '';

export type HeadlineRow = {
	id: number;
	title: string;
	date: string;
	parentTitle: string;
	image: ImageSource;
	/** Urutan di hero beranda (1–5), 0 bila tidak masuk hero. */
	hero: number;
	/** false bila judul/isi kosong — portal tidak menampilkannya. */
	visible: boolean;
};

export type ParentOption = { id: number; title: string; date: string; children: number };

export type HeadlineLimits = { title: number };

/** Pegawai untuk pilihan pejabat (dari tmemp). */
export type EmployeeOption = { nik: string; name: string };

/**
 * Foto pejabat: 'upload' = unggahan dashboard (UPLOAD_DIR/org[-thumb]),
 * 'lama' = berkas portal lama di static/, '' = tanpa foto.
 */
export type OrgPhoto = {
	file: string;
	kind: 'upload' | 'lama' | '';
	/** URL pratinjau di dashboard (hanya unggahan). */
	preview: string | null;
	/** Tautan foto lama di portal (PORTAL_PUBLIC_URL), bila ada. */
	legacyUrl: string | null;
};

export type OrgDeptView = {
	id: number;
	orgId: number;
	title: string;
	nik: string;
	head: string;
	/** NIK terisi tetapi tidak ada di tmemp → portal menampilkan tanpa nama. */
	headMissing: boolean;
	/** false bila judul & pejabat kosong — portal tidak menampilkannya. */
	visible: boolean;
	foto: OrgPhoto;
	entryBy: string;
	entryAt: string;
};

export type OrgUnitView = {
	id: number;
	title: string;
	/** 0 = pimpinan (puncak bagan), 1 = pusat/divisi. */
	type: number;
	nik: string;
	head: string;
	headMissing: boolean;
	foto: OrgPhoto;
	entryBy: string;
	entryAt: string;
	departments: OrgDeptView[];
};

export type OrgUnitValues = { title: string; type: number; nik: string };
export type OrgDeptValues = { title: string; nik: string; orgId: number };
export type OrgLimits = { unitTitle: number; deptTitle: number };

/** Gambar di folder berurutan waktu (kalender, buletin). */
export type TimedImageView = {
	file: string;
	/** Nama berkas tanpa ekstensi. */
	title: string;
	/** Waktu ubah (mtime) — diunggah atau terakhir dijadikan aktif. */
	date: string;
	size: string;
	preview: string;
	/** Thumbnail kecil untuk daftar. */
	thumb: string;
};

export type CalendarView = TimedImageView & { active: boolean };

export type BulletinView = TimedImageView & {
	/** Tanggal terbit 'YYYY-MM-DD' (dari waktu ubah, zona Jakarta). */
	day: string;
	/** Urutan di folder (1 = terbaru). */
	rank: number;
	/** Termasuk 3 terbaru yang tampil di Information center portal. */
	shown: boolean;
};
