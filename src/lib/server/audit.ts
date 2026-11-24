/**
 * Log audit: siapa mengubah apa. Satu baris JSON per kejadian ke AUDIT_LOG
 * (default ./logs/audit.log) + ringkasan ke console (pm2 logs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';

export type AuditEntry = {
	user: string;
	action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'login-failed';
	/** Tabel atau folder, mis. "tmlink", "buletin" — bisa beberapa: "tmmainarticledet+headline". */
	target?: string;
	id?: string | number;
	before?: unknown;
	after?: unknown;
	ip?: string;
};

const logFile = () => path.resolve(env.AUDIT_LOG || 'logs/audit.log');

export function audit(entry: AuditEntry): void {
	const { user, action, target, id, ip } = entry;
	const where = target ? ` ${target}${id !== undefined ? `#${id}` : ''}` : '';
	console.info(`[audit] ${user} ${action}${where}${ip ? ` dari ${ip}` : ''}`);
	try {
		const file = logFile();
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.appendFileSync(file, JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n');
	} catch (err) {
		console.error('[audit] gagal menulis log audit:', err);
	}
}
