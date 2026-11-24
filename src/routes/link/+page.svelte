<script lang="ts">
	import Pagination from '$lib/components/Pagination.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Link — Admin Portal DITTEK</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-semibold">Link</h1>
	<a class="btn btn-primary ml-auto" href="/link/baru">+ Tambah link</a>
</div>

<form method="GET" class="mb-3 flex flex-wrap gap-2" role="search">
	<input
		class="input max-w-xs"
		type="search"
		name="q"
		value={data.q}
		placeholder="Cari deskripsi atau URL…"
		aria-label="Cari"
	/>
	<select class="input w-auto" name="kat" aria-label="Kategori">
		<option value="" selected={data.kat === null}>Semua kategori</option>
		<option value="1" selected={data.kat === 1}>External</option>
		<option value="0" selected={data.kat === 0}>PT DI Internal</option>
	</select>
	<button class="btn">Cari</button>
	{#if data.q || data.kat !== null}<a class="btn" href="/link">Reset</a>{/if}
</form>

<div class="card overflow-x-auto">
	<table class="w-full text-left text-sm">
		<thead class="border-line bg-surface text-muted border-b text-xs tracking-wide uppercase">
			<tr>
				<th class="px-4 py-2.5 font-medium">Deskripsi</th>
				<th class="px-4 py-2.5 font-medium">URL</th>
				<th class="px-4 py-2.5 font-medium">Kategori</th>
				<th class="px-4 py-2.5 font-medium">Diubah</th>
				<th class="px-4 py-2.5"><span class="sr-only">Aksi</span></th>
			</tr>
		</thead>
		<tbody class="divide-line divide-y">
			{#each data.rows as r (r.id)}
				<tr class="hover:bg-surface">
					<td class="px-4 py-2.5 font-medium">
						<a class="link" href="/link/{r.id}">{r.desc || '(tanpa deskripsi)'}</a>
					</td>
					<td class="max-w-xs truncate px-4 py-2.5">
						<a
							class="text-muted font-mono text-xs hover:underline"
							href={r.url}
							target="_blank"
							rel="noopener noreferrer">{r.url}</a
						>
					</td>
					<td class="px-4 py-2.5 whitespace-nowrap">{r.categoryLabel}</td>
					<td class="text-muted px-4 py-2.5 text-xs whitespace-nowrap">
						{r.entryBy || '—'}{r.entryAt ? `, ${r.entryAt}` : ''}
					</td>
					<td class="px-4 py-2.5 text-right whitespace-nowrap">
						<a class="link mr-3" href="/link/{r.id}">Ubah</a>
						<a class="text-danger hover:underline" href="/link/{r.id}/hapus">Hapus</a>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5" class="px-4 py-8 text-center text-muted">
						{data.q || data.kat !== null ? 'Tidak ada link yang cocok.' : 'Belum ada link.'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<Pagination paging={data.paging} />

<p class="text-muted mt-4 text-xs">
	Urutan sama dengan di portal (abjad deskripsi). Batas kolom database: deskripsi {data.limits
		.desc}, URL {data.limits.url} karakter.
</p>
