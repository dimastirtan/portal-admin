/**
 * Koneksi database `dittek`. Hanya di $lib/server — tidak pernah ikut ke browser.
 *
 * Kolom tabel lama ber-charset latin1 (di MySQL = cp1252). Koneksi utf8mb4 membuat
 * MySQL mengonversi teks saat simpan & baca, jadi “ ” — é tersimpan sebagai satu
 * byte cp1252 dan terbaca kembali dengan benar oleh portal (portal juga memakai
 * utf8mb4). Karakter di luar cp1252 (emoji, ≥, →) ditolak lebih dulu oleh
 * $lib/server/text.ts — MySQL strict mode akan menolaknya juga.
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

export const pool = mysql.createPool({
	host: env.DB_HOST || '127.0.0.1',
	port: Number(env.DB_PORT || 3306),
	user: env.DB_USER || 'portal_admin',
	password: env.DB_PASSWORD ?? '',
	database: env.DB_NAME || 'dittek',
	charset: 'utf8mb4',
	// DATE/DATETIME sebagai string apa adanya ('2026-11-24') — tanpa pergeseran zona waktu.
	dateStrings: true,
	connectionLimit: 3,
	waitForConnections: true,
	connectTimeout: 5000,
	enableKeepAlive: true
});

export const db = drizzle(pool, { schema, mode: 'default' });
