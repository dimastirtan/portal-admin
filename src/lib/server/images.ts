/**
 * Olah gambar unggahan sebelum disimpan: jenis dicek dari ISI berkas (bukan
 * ekstensi), orientasi EXIF diluruskan, metadata (GPS dll.) dibuang, dikecilkan
 * (tidak pernah diperbesar), lalu disimpan WebP. Foto kamera 2–5 MB jadi ± 150–400 KB.
 */
import sharp from 'sharp';

// Server berjalan lama: jangan simpan cache libvips di memori.
sharp.cache(false);

export const MAX_UPLOAD_MB = 15;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const MAX_PIXELS = 50_000_000;
const ACCEPTED = new Set(['jpeg', 'png', 'webp']);

export type ImagePreset = {
	/** Sisi terpanjang maksimum (px). */
	maxSide: number;
	quality: number;
	/** Peringatan bila lebar asli lebih kecil dari ini. */
	minWidth?: number;
	/** Peringatan bila gambar portrait. */
	landscape?: boolean;
};

export const PRESETS = {
	headline: { maxSide: 1920, quality: 80, minWidth: 1920, landscape: true },
	buletin: { maxSide: 1600, quality: 80 },
	kalender: { maxSide: 2000, quality: 85 },
	org: { maxSide: 1200, quality: 80 }
} satisfies Record<string, ImagePreset>;

export type ProcessedImage = { data: Buffer; width: number; height: number; warnings: string[] };
export type ImageResult = { ok: true; image: ProcessedImage } | { ok: false; error: string };

/** Berkas yang dipilih di form; null bila input file dibiarkan kosong. */
export function uploadedFile(form: FormData, name: string): File | null {
	const value = form.get(name);
	return value instanceof File && value.size > 0 ? value : null;
}

export async function processImage(file: File, preset: ImagePreset): Promise<ImageResult> {
	if (file.size > MAX_UPLOAD_BYTES) {
		const mb = (file.size / 1024 / 1024).toFixed(1);
		return { ok: false, error: `Berkas terlalu besar (${mb} MB). Maksimal ${MAX_UPLOAD_MB} MB.` };
	}
	const input = Buffer.from(await file.arrayBuffer());

	let meta: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>;
	try {
		meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();
	} catch {
		return {
			ok: false,
			error: 'Berkas bukan gambar yang bisa dibaca. Gunakan JPG, PNG, atau WebP.'
		};
	}
	if (!ACCEPTED.has(meta.format ?? '')) {
		return {
			ok: false,
			error: `Format gambar harus JPG, PNG, atau WebP (berkas ini: ${meta.format ?? 'tidak dikenal'}).`
		};
	}
	if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_PIXELS) {
		return { ok: false, error: 'Resolusi gambar terlalu besar (maks. 50 megapiksel).' };
	}

	// Ukuran setelah orientasi EXIF (foto ponsel sering disimpan miring).
	const turned = (meta.orientation ?? 1) >= 5;
	const width = (turned ? meta.height : meta.width) ?? 0;
	const height = (turned ? meta.width : meta.height) ?? 0;
	const warnings: string[] = [];
	if (preset.landscape && height > width) {
		warnings.push(
			'Gambar berorientasi portrait — di hero beranda akan terpotong. Sebaiknya landscape.'
		);
	}
	if (preset.minWidth && width < preset.minWidth) {
		warnings.push(
			`Lebar gambar hanya ${width} px (disarankan minimal ${preset.minWidth} px) — di hero bisa tampak kurang tajam.`
		);
	}

	try {
		const { data, info } = await sharp(input, { limitInputPixels: MAX_PIXELS })
			.rotate()
			.resize({
				width: preset.maxSide,
				height: preset.maxSide,
				fit: 'inside',
				withoutEnlargement: true
			})
			.webp({ quality: preset.quality })
			.toBuffer({ resolveWithObject: true });
		return { ok: true, image: { data, width: info.width, height: info.height, warnings } };
	} catch (err) {
		console.error('[gambar] gagal diolah:', err);
		return {
			ok: false,
			error: 'Gambar gagal diolah. Coba simpan ulang sebagai JPG lalu unggah lagi.'
		};
	}
}
