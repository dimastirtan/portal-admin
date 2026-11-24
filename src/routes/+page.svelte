<script lang="ts">
	import { MODULES } from '$lib/modules';

	let { data } = $props();
</script>

<svelte:head><title>Beranda — Admin Portal DITTEK</title></svelte:head>

<h1 class="mb-1 text-2xl font-semibold">Selamat datang, {data.user?.username}</h1>
<p class="text-muted mb-6 text-sm">Pilih modul untuk mengelola konten portal.</p>

<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	{#each MODULES as m (m.href)}
		{#if m.ready}
			<a href={m.href} class="card hover:border-brand block p-4">
				<span class="text-brand font-medium">{m.label}</span>
				<span class="text-muted mt-1 block text-sm">{m.desc}</span>
			</a>
		{:else}
			<div class="card p-4 opacity-60">
				<span class="font-medium">{m.label}</span>
				<span class="bg-surface text-muted ml-1 rounded px-1.5 py-0.5 text-xs">segera</span>
				<span class="text-muted mt-1 block text-sm">{m.desc}</span>
			</div>
		{/if}
	{/each}
</div>

<h2 class="text-muted mt-8 mb-2 text-sm font-semibold tracking-wide uppercase">Status sistem</h2>
<ul class="card divide-line divide-y text-sm">
	{#each data.checks as c (c.label)}
		<li class="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5">
			<span class="w-36 font-medium">{c.label}</span>
			<span class={c.ok ? 'text-ok' : 'text-warn'}>{c.ok ? '✓' : '!'} {c.note}</span>
			{#if 'path' in c}<code class="text-muted text-xs">{c.path}</code>{/if}
		</li>
	{/each}
</ul>
