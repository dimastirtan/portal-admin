<script lang="ts">
	import { TELP_CATEGORIES } from '$lib/categories';
	import Pagination from '$lib/components/Pagination.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Telepon — Admin Portal DITTEK</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-semibold">Telepon penting</h1>
	<a
		class="btn btn-primary ml-auto"
		href={data.kat === null ? '/telepon/baru' : `/telepon/baru?kat=${data.kat}`}>+ Tambah nomor</a
	>
</div>

<form method="GET" class="mb-3 flex flex-wrap gap-2" role="search">
	<input
		class="input max-w-xs"
		type="search"
		name="q"
		value={data.q}
		placeholder="Cari nama atau nomor…"
		aria-label="Cari"
	/>
	<select class="input w-auto" name="kat" aria-label="Kelompok">
		<option value="" selected={data.kat === null}>Semua kelompok</option>
		{#each TELP_CATEGORIES as c (c.value)}
			<option value={c.value} selected={data.kat === c.value}>{c.label}</option>
		{/each}
	</select>
	<button class="btn">Cari</button>
	{#if data.q || data.kat !== null}<a class="btn" href="/telepon">Reset</a>{/if}
</form>

<div class="card overflow-x-auto">
	<table class="w-full text-left text-sm">
		<thead class="border-line bg-surface text-muted border-b text-xs tracking-wide uppercase">
			<tr>
				<th class="px-4 py-2.5 font-medium">Nama</th>
				<th class="px-4 py-2.5 font-medium">Nomor</th>
				<th class="px-4 py-2.5 font-medium">Kelompok</th>
				<th class="px-4 py-2.5 font-medium">Diubah</th>
				<th class="px-4 py-2.5"><span class="sr-only">Aksi</span></th>
			</tr>
		</thead>
		<tbody class="divide-line divide-y">
			{#each data.rows as r (r.id)}
				<tr class="hover:bg-surface">
					<td class="px-4 py-2.5 font-medium">
						<a class="link" href="/telepon/{r.id}">{r.title || '(tanpa nama)'}</a>
					</td>
					<td class="px-4 py-2.5 font-mono text-xs">{r.no}</td>
					<td class="px-4 py-2.5 whitespace-nowrap">
						{r.categoryLabel}
						{#if !r.shown}<span class="text-warn text-xs">(tidak tampil di portal)</span>{/if}
					</td>
					<td class="text-muted px-4 py-2.5 text-xs whitespace-nowrap">
						{r.entryBy || '—'}{r.entryAt ? `, ${r.entryAt}` : ''}
					</td>
					<td class="px-4 py-2.5 text-right whitespace-nowrap">
						<a class="link mr-3" href="/telepon/{r.id}">Ubah</a>
						<a class="text-danger hover:underline" href="/telepon/{r.id}/hapus">Hapus</a>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5" class="text-muted px-4 py-8 text-center">
						{data.q || data.kat !== null ? 'Tidak ada nomor yang cocok.' : 'Belum ada nomor.'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<Pagination paging={data.paging} />
