/**
 * Pesan ramah untuk galat MySQL saat menyimpan — supaya admin tidak kehilangan
 * isian form karena halaman error 500. Detail teknis tetap ke console.
 */
export function dbErrorMessage(err: unknown, context: string): string {
	const e = err as { code?: string; errno?: number; message?: string };
	console.error(`[db] ${context}:`, e.code ?? '', e.message ?? err);
	switch (e.code) {
		case 'ER_DATA_TOO_LONG':
			return 'Isian terlalu panjang untuk kolom database. Persingkat lalu simpan lagi.';
		case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
		case 'WARN_DATA_TRUNCATED':
			return 'Ada karakter yang tidak bisa disimpan di database. Periksa tanda baca khusus/emoji.';
		case 'ER_TABLEACCESS_DENIED_ERROR':
		case 'ER_COLUMNACCESS_DENIED_ERROR':
		case 'ER_DBACCESS_DENIED_ERROR':
			return 'User database dashboard tidak punya izin untuk perubahan ini (lihat README › Database).';
		case 'ECONNREFUSED':
		case 'ETIMEDOUT':
		case 'ENOTFOUND':
		case 'EHOSTUNREACH':
		case 'PROTOCOL_CONNECTION_LOST':
			return 'Database tidak terjangkau. Coba lagi sebentar lagi.';
		default:
			return 'Gagal menyimpan ke database. Coba lagi; bila berulang, hubungi pengelola server.';
	}
}
