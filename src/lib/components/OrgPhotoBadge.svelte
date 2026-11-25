<script lang="ts">
	import type { OrgPhoto } from '$lib/types';

	let {
		foto,
		name,
		size = 'h-10 w-10'
	}: { foto: OrgPhoto; name: string; size?: string } = $props();

	const initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase())
			.join('') || '—'
	);
</script>

{#if foto.preview}
	<img
		src={foto.preview}
		alt=""
		class="{size} border-line shrink-0 rounded-full border object-cover"
		loading="lazy"
	/>
{:else}
	<span
		class="{size} bg-surface text-muted border-line grid shrink-0 place-items-center rounded-full border text-xs font-medium"
		title={foto.kind === 'lama' ? `Foto lama: ${foto.file}` : 'Tanpa foto'}>{initials}</span
	>
{/if}
