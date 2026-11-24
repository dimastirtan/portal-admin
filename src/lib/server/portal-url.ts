/**
 * Alamat portal yang dibuka admin di browser (PORTAL_PUBLIC_URL, opsional) — untuk
 * tautan "Lihat di portal". Berbeda dari PORTAL_URL (alamat internal untuk /api/cache).
 */
import { env } from '$env/dynamic/private';

export function portalLink(pathname: string): string | null {
	const base = env.PORTAL_PUBLIC_URL?.trim();
	if (!base) return null;
	try {
		return new URL(pathname, base).href;
	} catch {
		return null;
	}
}
