/**
 * Hash kata sandi admin dengan scrypt (bawaan Node — tanpa modul native).
 * Dipakai server (auth.ts) dan `npm run hash-password` (scripts/hash-password.js).
 *
 * Format: scrypt.<N>.<r>.<p>.<salt base64url>.<hash base64url>
 * Tanpa "$" — Vite (mode dev) mengganti "$xxx" di .env sebagai variabel.
 * Parameter N=2^15, r=8, p=3 (rekomendasi OWASP, ± 32 MiB per percobaan).
 */
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';

const N = 32768;
const R = 8;
const P = 3;
const KEYLEN = 32;
const MAXMEM = 128 * 1024 * 1024;

/**
 * @param {string} password
 * @param {Buffer} salt
 * @param {{ N: number; r: number; p: number }} params
 * @returns {Promise<Buffer>}
 */
function derive(password, salt, params) {
	return new Promise((resolve, reject) => {
		scrypt(password, salt, KEYLEN, { ...params, maxmem: MAXMEM }, (err, key) =>
			err ? reject(err) : resolve(key)
		);
	});
}

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
	const salt = randomBytes(16);
	const key = await derive(password, salt, { N, r: R, p: P });
	return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('.');
}

/**
 * true bila string berbentuk hash buatan hashPassword().
 * @param {string} stored
 */
export function isPasswordHash(stored) {
	return /^scrypt\.\d+\.\d+\.\d+\.[\w-]+\.[\w-]+$/.test(stored);
}

/**
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
	if (!isPasswordHash(stored)) return false;
	const [, n, r, p, salt, hash] = stored.split('.');
	const expected = Buffer.from(hash, 'base64url');
	try {
		const key = await derive(password, Buffer.from(salt, 'base64url'), {
			N: Number(n),
			r: Number(r),
			p: Number(p)
		});
		return key.length === expected.length && timingSafeEqual(key, expected);
	} catch {
		return false;
	}
}
