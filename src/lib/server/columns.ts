/**
 * Panjang maksimum kolom teks, dibaca dari information_schema (bukan dari kode),
 * supaya form selalu sesuai database — mis. tmlink.N_URL_LINK masih varchar(50),
 * dan bila kelak dilebarkan lewat ALTER TABLE, batas baru terpakai paling lambat
 * 10 menit kemudian (atau setelah restart).
 */
import { pool } from '$lib/server/db';

const TTL = 10 * 60_000;
const cache = new Map<string, { at: number; limits: Map<string, number> }>();

export async function columnLimits(table: string): Promise<Map<string, number>> {
	const hit = cache.get(table);
	if (hit && Date.now() - hit.at < TTL) return hit.limits;
	const [rows] = await pool.query(
		`SELECT COLUMN_NAME AS name, CHARACTER_MAXIMUM_LENGTH AS len
		   FROM information_schema.COLUMNS
		  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CHARACTER_MAXIMUM_LENGTH IS NOT NULL`,
		[table]
	);
	const limits = new Map(
		(rows as { name: string; len: number | string }[]).map((r) => [r.name, Number(r.len)])
	);
	cache.set(table, { at: Date.now(), limits });
	return limits;
}

/** Batas kolom, atau `fallback` bila kolom tidak ditemukan. */
export const limitOf = (limits: Map<string, number>, column: string, fallback: number) =>
	limits.get(column) ?? fallback;
