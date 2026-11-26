/**
 * Teks masuk & keluar database.
 *
 * Masuk: kolom latin1 (cp1252) hanya menampung ±250 karakter Latin. Input
 * dirapikan (spasi tak terlihat dari salin-tempel, tanda hubung khusus), lalu
 * karakter yang tetap tidak muat (emoji, ≥, →, huruf Yunani, …) DITOLAK dengan
 * pesan jelas — bukan diam-diam jadi "?".
 *
 * Keluar: data lama berisi mojibake (byte UTF-8 di kolom latin1, mis. "â€œ").
 * fixText() — salinan dari portal — merapikannya untuk ditampilkan di form;
 * saat disimpan ulang, teksnya tersimpan bersih.
 */

/** Karakter cp1252 di rentang 0x80–0x9F (sisanya = Latin-1 biasa). */
const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

/** true bila karakter bisa disimpan di kolom latin1 MySQL. */
function fitsLatin1(ch: string): boolean {
	const c = ch.codePointAt(0)!;
	if (c === 0x09 || c === 0x0a || c === 0x0d) return true;
	if (c >= 0x20 && c <= 0x7e) return true;
	if (c >= 0xa0 && c <= 0xff) return true;
	return CP1252_EXTRA.has(ch);
}

/** Karakter (unik) yang tidak bisa disimpan. */
export function unsupportedChars(s: string): string[] {
	const bad = new Set<string>();
	for (const ch of s) if (!fitsLatin1(ch)) bad.add(ch);
	return [...bad];
}

/** Rapikan input: NFC, buang karakter tak terlihat, seragamkan spasi & tanda hubung. */
export function normalize(raw: unknown, multiline = false): string {
	let s = String(raw ?? '')
		.normalize('NFC')
		.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
		.replace(/[\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
		.replace(/[\u2010\u2011\u2212]/g, '-')
		.replace(/\r\n?/g, '\n');
	s = multiline
		? s
				.split('\n')
				.map((line) => line.replace(/[ \t\u00A0]+$/, ''))
				.join('\n')
				.replace(/\n{3,}/g, '\n\n')
		: s.replace(/\s+/g, ' ');
	return s.trim();
}

/** Hapus karakter yang tidak muat — untuk kata kunci pencarian (tanpa pesan error). */
export const searchText = (raw: unknown, max = 100) =>
	[...normalize(raw)].filter(fitsLatin1).join('').slice(0, max);

export type Errors = Record<string, string>;

const describe = (chars: string[]) =>
	chars
		.slice(0, 5)
		.map((ch) => {
			const code = ch.codePointAt(0)!;
			return code < 0x20 ? `kode ${code}` : `“${ch}”`;
		})
		.join(', ') + (chars.length > 5 ? ', …' : '');

/**
 * Baca & validasi satu field teks dari form. Mengembalikan nilai yang sudah
 * dirapikan; bila tidak valid, pesan dimasukkan ke `errors[name]`.
 */
export function readText(
	form: FormData,
	name: string,
	opts: { label: string; max: number; required?: boolean; multiline?: boolean },
	errors: Errors
): string {
	const value = normalize(form.get(name), opts.multiline);
	if (!value) {
		if (opts.required) errors[name] = `${opts.label} wajib diisi.`;
		return value;
	}
	const bad = unsupportedChars(value);
	if (bad.length) {
		errors[name] =
			`Karakter berikut tidak bisa disimpan di database: ${describe(bad)}. ` +
			'Hapus atau ganti dengan huruf/tanda baca biasa.';
	} else if (value.length > opts.max) {
		errors[name] = `${opts.label} maksimal ${opts.max} karakter (sekarang ${value.length}).`;
	}
	return value;
}

// ── Tampilan data lama ───────────────────────────────────────────────────────

const MOJIBAKE: [RegExp, string][] = [
	[/â€œ/g, '“'],
	[/â€\x9d/g, '”'],
	[/â€™/g, '’'],
	[/â€˜/g, '‘'],
	[/â€”/g, '—'],
	[/â€“/g, '–'],
	[/â€¦/g, '…'],
	[/â€¢/g, '•'],
	[/â€/g, '”'],
	[/Ã©/g, 'é'],
	[/Ã¨/g, 'è'],
	[/Ã¢/g, 'â'],
	[/Ã /g, 'à'],
	[/Ã´/g, 'ô'],
	[/Ã§/g, 'ç'],
	[/Ã¼/g, 'ü'],
	[/Ã±/g, 'ñ'],
	[/â‚¬/g, '€'],
	[/Â°/g, '°'],
	[/Â /g, ' '],
	[/Â/g, '']
];

/** Perbaiki mojibake data lama (sama dengan fixText portal). */
export function fixText(input: unknown): string {
	let s = String(input ?? '').trim();
	for (const [re, to] of MOJIBAKE) s = s.replace(re, to);
	return s;
}

// ── Tanggal (zona Asia/Jakarta, apa pun zona server) ─────────────────────────

const jakarta = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Jakarta',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hourCycle: 'h23'
});

const jakartaParts = (d: Date) =>
	Object.fromEntries(jakarta.formatToParts(d).map((x) => [x.type, x.value]));

/** 'YYYY-MM-DD HH:MM:SS' waktu Jakarta sekarang — untuk kolom DATETIME. */
export function nowJakarta(): string {
	const p = jakartaParts(new Date());
	return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

/** 'YYYY-MM-DD' hari ini (Jakarta) — untuk kolom DATE. */
export const todayJakarta = () => nowJakarta().slice(0, 10);

/** Tanggal untuk tabel: '24 Nov 2026'; '' bila kosong/'0000-00-00'. */
export function formatDate(value: string | null | undefined): string {
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
	if (!m || m[1] === '0000') return '';
	const bulan = 'Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des'.split(' ');
	return `${Number(m[3])} ${bulan[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** Waktu berkas untuk tampilan: '25 Nov 2026 10.30' (Jakarta). */
export function formatDateTime(d: Date): string {
	const p = jakartaParts(d);
	return `${formatDate(`${p.year}-${p.month}-${p.day}`)} ${p.hour}.${p.minute}`;
}
