<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let { data, form } = $props();

	const q = (file: string) => `berkas=${encodeURIComponent(file)}`;
</script>

<svelte:head><title>Buletin — Admin Portal DITTEK</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-semibold">Buletin</h1>
	{#if data.portalUrl}
		<a class="link text-sm" href={data.portalUrl} target="_blank" rel="noopener"
			>Lihat di portal ↗</a
		>
	{/if}
	<a class="btn btn-primary ml-auto" href="/buletin/baru">+ Unggah buletin</a>
</div>

<p class="text-muted mb-3 text-sm">
	Information center di beranda portal menampilkan <strong>3 buletin dengan tanggal terbaru</strong
	>. Judul = nama berkas; tanggal diatur di form tambah/ubah.
</p>

{#if form?.error}<div class="mb-3"><FormAlert message={form.error} /></div>{/if}

<form method="GET" class="mb-3 flex flex-wrap gap-2" role="search">
	<input
		class="input max-w-xs"
		type="search"
		name="q"
		value={data.q}
		placeholder="Cari judul…"
		aria-label="Cari judul"
	/>
	<button class="btn">Cari</button>
	{#if data.q}<a class="btn" href="/buletin">Reset</a>{/if}
</form>

<div class="card overflow-x-auto">
	<table class="w-full text-left text-sm">
		<thead class="border-line bg-surface text-muted border-b text-xs tracking-wide uppercase">
			<tr>
				<th class="px-4 py-2.5 font-medium"><span class="sr-only">Poster</span></th>
				<th class="px-4 py-2.5 font-medium">Judul</th>
				<th class="px-4 py-2.5 font-medium">Tanggal</th>
				<th class="px-4 py-2.5 font-medium">Ukuran</th>
				<th class="px-4 py-2.5"><span class="sr-only">Aksi</span></th>
			</tr>
		</thead>
		<tbody class="divide-line divide-y">
			{#each data.rows as b (b.file)}
				<tr class="hover:bg-surface">
					<td class="w-16 px-4 py-2">
						<a href={b.preview} target="_blank" rel="noopener" title="Buka ukuran penuh">
							<img
								src={b.thumb}
								alt=""
								loading="lazy"
								decoding="async"
								class="border-line bg-surface h-16 w-auto max-w-14 rounded border object-contain"
							/>
						</a>
					</td>
					<td class="px-4 py-2">
						<a class="link font-medium" href="/buletin/ubah?{q(b.file)}">{b.title}</a>
						{#if b.shown}
							<span
								class="bg-brand ml-1 rounded px-1.5 py-0.5 align-middle text-xs font-medium whitespace-nowrap text-white"
								>Tampil di portal</span
							>
						{/if}
					</td>
					<td class="text-muted px-4 py-2 text-xs whitespace-nowrap">{b.date}</td>
					<td class="text-muted px-4 py-2 text-xs whitespace-nowrap">{b.size}</td>
					<td class="px-4 py-2 text-right whitespace-nowrap">
						{#if b.rank > 1}
							<form method="POST" action="?/naikkan" class="mr-3 inline">
								<input type="hidden" name="berkas" value={b.file} />
								<button
									class="btn"
									title="Jadikan paling depan di Information center — tanggalnya jadi hari ini"
									>Paling depan</button
								>
							</form>
						{/if}
						<a class="link mr-3" href="/buletin/ubah?{q(b.file)}">Ubah</a>
						<a class="text-danger hover:underline" href="/buletin/hapus?{q(b.file)}">Hapus</a>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5" class="text-muted px-4 py-8 text-center">
						{data.q ? 'Tidak ada buletin yang cocok.' : 'Belum ada buletin.'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<Pagination paging={data.paging} />
