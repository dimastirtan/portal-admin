/** Modul dashboard — urutan menu & kartu beranda. `ready: false` = belum dibuat. */
export const MODULES = [
	{
		href: '/link',
		label: 'Link',
		ready: true,
		desc: 'Tautan External & PT DI Internal di halaman /link.'
	},
	{
		href: '/telepon',
		label: 'Telepon',
		ready: true,
		desc: 'Nomor telepon penting (PT DI, Bandung, National).'
	},
	{
		href: '/headline',
		label: 'Headline',
		ready: true,
		desc: 'Berita utama: hero beranda & /berita-utama.'
	},
	{
		href: '/organisasi',
		label: 'Organisasi',
		ready: true,
		desc: 'Struktur organisasi, pejabat & fotonya.'
	},
	{ href: '/kalender', label: 'Kalender', ready: false, desc: 'Gambar kalender kerja.' },
	{
		href: '/buletin',
		label: 'Buletin',
		ready: false,
		desc: 'Poster buletin di Information center.'
	}
] as const;
