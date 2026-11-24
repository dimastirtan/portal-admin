/** Parameter daftar: pencarian ?q=, halaman ?hal= (25 baris per halaman). */
import type { Paging } from '$lib/types';
import { searchText } from './text';

export const PAGE_SIZE = 25;

export function listParams(url: URL) {
	const q = searchText(url.searchParams.get('q'));
	const page = Math.max(1, Math.min(10_000, parseInt(url.searchParams.get('hal') ?? '', 10) || 1));
	return { q, page, offset: (page - 1) * PAGE_SIZE };
}

/** Pola LIKE '%kata%' dengan % _ \ di-escape. */
export const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

export const paging = (page: number, total: number): Paging => ({
	page,
	pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
	total,
	size: PAGE_SIZE
});

/** Id dari parameter route; null bila bukan bilangan bulat positif. */
export function parseId(raw: string): number | null {
	if (!/^\d{1,9}$/.test(raw)) return null;
	const id = Number(raw);
	return id > 0 ? id : null;
}
