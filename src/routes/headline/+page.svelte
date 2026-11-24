<script lang="ts">
	import Pagination from '$lib/components/Pagination.svelte';
	import type { ImageSource } from '$lib/types';

	let { data } = $props();

	const imageLabel: Record<ImageSource, string> = {
		upload: 'Unggahan',
		isi: 'Dari isi (lama)',
		induk: 'Dari induk (lama)',
		'': '—'
	};
</script>

<svelte:head><title>Headline — Admin Portal DITTEK</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-semibold">Headline</h1>
	<a class="btn btn-primary ml-auto" href="/headline/baru">+ Tambah headline</a>
</div>

<form method="GET" class="mb-3 flex flex-wrap gap-2" role="search">
	<input
		class="input max-w-xs"
		type="search"
		name="q"
		value={data.q}
		placeholder="Cari judul…"
		aria-label="Cari"
	/>
	<button class="btn">Cari</button>
	{#if data.q}<a class="btn" href="/headline">Reset</a>{/if}
</form>

<div class="card overflow-x-auto">
	<table class="w-full text-left text-sm">
		<thead class="border-line bg-surface text-muted border-b text-xs tracking-wide uppercase">
			<tr>
				<th class="px-4 py-2.5 font-medium">Tanggal</th>
				<th class="px-4 py-2.5 font-medium">Judul</th>
				<th class="px-4 py-2.5 font-medium">Gambar</th>
				<th class="px-4 py-2.5 font-medium">Di portal</th>
				<th class="px-4 py-2.5"><span class="sr-only">Aksi</span></th>
			</tr>
		</thead>
		<tbody class="divide-line divide-y">
			{#each data.rows as r (r.id)}
				<tr class="hover:bg-surface">
					<td class="text-muted px-4 py-2.5 text-xs whitespace-nowrap">{r.date || '—'}</td>
					<td class="px-4 py-2.5">
						<a class="link font-medium" href="/headline/{r.id}">{r.title || '(tanpa judul)'}</a>
						{#if r.parentTitle && r.parentTitle !== r.title}
							<span class="text-muted block text-xs">Induk: {r.parentTitle}</span>
						{/if}
					</td>
					<td
						class="px-4 py-2.5 text-xs whitespace-nowrap {r.image === 'upload'
							? 'text-ok'
							: 'text-muted'}">{imageLabel[r.image]}</td
					>
					<td class="px-4 py-2.5 text-xs whitespace-nowrap">
						{#if !r.visible}
							<span class="text-warn">Tidak tampil (judul/isi kosong)</span>
						{:else if r.hero}
							<span class="bg-brand rounded px-1.5 py-0.5 font-medium text-white"
								>Hero #{r.hero}</span
							>
						{:else}
							<span class="text-muted">Daftar berita</span>
						{/if}
						{#if data.portalBase && r.visible}
							<a class="link ml-1" href="{data.portalBase}{r.id}" target="_blank" rel="noopener"
								>lihat ↗</a
							>
						{/if}
					</td>
					<td class="px-4 py-2.5 text-right whitespace-nowrap">
						<a class="link mr-3" href="/headline/{r.id}">Ubah</a>
						<a class="text-danger hover:underline" href="/headline/{r.id}/hapus">Hapus</a>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5" class="text-muted px-4 py-8 text-center">
						{data.q ? 'Tidak ada headline yang cocok.' : 'Belum ada headline.'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<Pagination paging={data.paging} />
