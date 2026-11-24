/**
 * Login admin.
 *
 *  - Daftar admin: ADMIN_USERS="user:hash,user2:hash" di .env (hash dari
 *    `npm run hash-password`). Admin yang dihapus dari daftar langsung keluar.
 *  - Sesi: id acak 256-bit di memori proses (pm2 satu proses). Restart = login ulang.
 *    Berakhir setelah 8 jam tidak aktif atau 12 jam sejak login.
 *  - Batas percobaan: 5 gagal per IP+username, atau 20 per IP, dalam 15 menit
 *    → dikunci sampai jendela 15 menit itu lewat.
 */
import { randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { hashPassword, isPasswordHash, verifyPassword } from './password.js';

export const USERNAME_RE = /^[a-z0-9]{1,10}$/;

// ── Daftar admin ──────────────────────────────────────────────────────────────

let parsedFrom: string | undefined;
let parsed = new Map<string, string>();

export function admins(): Map<string, string> {
	const raw = env.ADMIN_USERS ?? '';
	if (raw === parsedFrom) return parsed;
	const map = new Map<string, string>();
	for (const item of raw.split(/[,\n]/)) {
		const entry = item.trim();
		if (!entry) continue;
		const at = entry.indexOf(':');
		const user = entry.slice(0, at).trim().toLowerCase();
		const hash = entry.slice(at + 1).trim();
		if (at < 1 || !USERNAME_RE.test(user) || !isPasswordHash(hash)) {
			console.warn(`[auth] entri ADMIN_USERS tidak valid diabaikan: "${entry.slice(0, 12)}…"`);
			continue;
		}
		map.set(user, hash);
	}
	parsedFrom = raw;
	parsed = map;
	return map;
}

/** Hash dummy supaya username yang tidak ada butuh waktu sama dengan yang ada. */
let dummyHash: Promise<string> | undefined;

export async function checkLogin(username: string, password: string): Promise<boolean> {
	const stored = admins().get(username);
	if (!stored) {
		dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
		await verifyPassword(password, await dummyHash);
		return false;
	}
	return verifyPassword(password, stored);
}

// ── Sesi ──────────────────────────────────────────────────────────────────────

const IDLE_MS = 8 * 3600_000;
export const SESSION_MAX_MS = 12 * 3600_000;

type Session = { username: string; created: number; seen: number };
const sessions = new Map<string, Session>();

export function createSession(username: string): string {
	const id = randomBytes(32).toString('base64url');
	const now = Date.now();
	sessions.set(id, { username, created: now, seen: now });
	return id;
}

export function getSession(id: string): Session | null {
	const s = sessions.get(id);
	if (!s) return null;
	const now = Date.now();
	if (now - s.seen > IDLE_MS || now - s.created > SESSION_MAX_MS || !admins().has(s.username)) {
		sessions.delete(id);
		return null;
	}
	s.seen = now;
	return s;
}

export const destroySession = (id: string) => sessions.delete(id);

// ── Batas percobaan login ─────────────────────────────────────────────────────

const WINDOW_MS = 15 * 60_000;
const MAX_PER_USER = 5;
const MAX_PER_IP = 20;
const failures = new Map<string, { count: number; first: number }>();

function hits(key: string, now: number) {
	const f = failures.get(key);
	if (!f || now - f.first > WINDOW_MS) return null;
	return f;
}

/** Sisa waktu terkunci (ms); 0 bila boleh mencoba. */
export function loginBlockedFor(ip: string, username: string): number {
	const now = Date.now();
	let wait = 0;
	for (const [key, max] of [
		[`u:${ip}|${username}`, MAX_PER_USER],
		[`ip:${ip}`, MAX_PER_IP]
	] as const) {
		const f = hits(key, now);
		if (f && f.count >= max) wait = Math.max(wait, f.first + WINDOW_MS - now);
	}
	return wait;
}

export function recordLoginFailure(ip: string, username: string): void {
	const now = Date.now();
	for (const key of [`u:${ip}|${username}`, `ip:${ip}`]) {
		const f = hits(key, now);
		failures.set(key, f ? { ...f, count: f.count + 1 } : { count: 1, first: now });
	}
}

export const clearLoginFailures = (ip: string, username: string) =>
	failures.delete(`u:${ip}|${username}`);

// Bersihkan sesi & catatan gagal yang kedaluwarsa (tidak menahan proses tetap hidup).
setInterval(() => {
	const now = Date.now();
	for (const [id, s] of sessions) {
		if (now - s.seen > IDLE_MS || now - s.created > SESSION_MAX_MS) sessions.delete(id);
	}
	for (const [key, f] of failures) if (now - f.first > WINDOW_MS) failures.delete(key);
}, 10 * 60_000).unref();
