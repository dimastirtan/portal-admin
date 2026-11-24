<script lang="ts">
	import { page } from '$app/state';
	import type { Paging } from '$lib/types';

	let { paging }: { paging: Paging } = $props();

	const href = (n: number) => {
		// Salinan sementara untuk membangun URL — bukan state, jadi tidak perlu reaktif.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(page.url.searchParams);
		if (n <= 1) params.delete('hal');
		else params.set('hal', String(n));
		const qs = params.toString();
		return qs ? `?${qs}` : page.url.pathname;
	};

	const from = $derived(paging.total ? (paging.page - 1) * paging.size + 1 : 0);
	const to = $derived(Math.min(paging.total, paging.page * paging.size));
</script>

<nav class="text-muted mt-3 flex items-center justify-between text-sm" aria-label="Halaman">
	<span>{from}–{to} dari {paging.total}</span>
	{#if paging.pages > 1}
		<span class="flex items-center gap-2">
			{#if paging.page > 1}
				<a class="btn" href={href(paging.page - 1)}>‹ Sebelumnya</a>
			{/if}
			<span>Halaman {paging.page} / {paging.pages}</span>
			{#if paging.page < paging.pages}
				<a class="btn" href={href(paging.page + 1)}>Berikutnya ›</a>
			{/if}
		</span>
	{/if}
</nav>
