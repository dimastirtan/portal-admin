<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { MODULES } from '$lib/modules';

	let { data, children } = $props();

	const active = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

	const flashClass = {
		ok: 'border-ok/30 bg-ok-bg text-ok',
		warn: 'border-warn/30 bg-warn-bg text-warn',
		error: 'border-danger/30 bg-danger-bg text-danger'
	};
</script>

{#if data.user}
	<header class="bg-brand text-white">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
			<a href="/" class="font-semibold tracking-tight">Admin Portal DITTEK</a>
			<nav class="flex flex-wrap gap-1 text-sm" aria-label="Modul">
				{#each MODULES as m (m.href)}
					{#if m.ready}
						<a
							href={m.href}
							class="rounded px-2.5 py-1 hover:bg-white/15 {active(m.href)
								? 'bg-white/20 font-medium'
								: ''}"
							aria-current={active(m.href) ? 'page' : undefined}>{m.label}</a
						>
					{:else}
						<span class="cursor-default rounded px-2.5 py-1 text-white/45" title="Belum tersedia"
							>{m.label}</span
						>
					{/if}
				{/each}
			</nav>
			<form method="POST" action="/logout" class="ml-auto flex items-center gap-3 text-sm">
				<span class="text-white/80">{data.user.username}</span>
				<button class="rounded border border-white/40 px-2.5 py-1 hover:bg-white/15">Keluar</button>
			</form>
		</div>
	</header>
{/if}

<main class="mx-auto max-w-6xl px-4 py-6">
	{#each data.flash as msg, i (i)}
		<p class="mb-4 rounded-md border px-4 py-2.5 text-sm {flashClass[msg.type]}" role="status">
			{msg.text}
		</p>
	{/each}
	{@render children()}
</main>
