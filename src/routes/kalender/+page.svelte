<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';

	let { data, form } = $props();

	const active = $derived(data.items.find((c) => c.active));
	const history = $derived(data.items.filter((c) => !c.active));
	const upload = $derived(form?.action === 'unggah' ? form : null);
	const deleteHref = (file: string) => `/kalender/hapus?berkas=${encodeURIComponent(file)}`;
</script>

<svelte:head><title>Kalender kerja — Admin Portal DITTEK</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-semibold">Kalender kerja</h1>
	{#if data.portalUrl}
		<a class="link text-sm" href={data.portalUrl} target="_blank" rel="noopener"
			>Lihat di portal ↗</a
		>
	{/if}
</div>

{#if form?.action === 'aktifkan'}
	<div class="mb-4"><FormAlert message={form.error} /></div>
{/if}

<div class="grid items-start gap-4 lg:grid-cols-[1fr_22rem]">
	<section class="card p-4">
		<h2 class="mb-3 font-semibold">Sedang tampil di portal</h2>
		{#if active}
			<a href={active.preview} target="_blank" rel="noopener" title="Buka ukuran penuh">
				<img
					src={active.preview}
					alt="Kalender kerja yang tampil: {active.title}"
					class="border-line bg-surface max-h-[32rem] w-auto max-w-full rounded border"
				/>
			</a>
			<div class="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<p class="font-medium">{active.title}</p>
				<p class="text-muted text-xs">{active.date} · {active.size}</p>
				<a class="text-danger ml-auto text-sm hover:underline" href={deleteHref(active.file)}
					>Hapus</a
				>
			</div>
		{:else}
			<p class="text-muted text-sm">
				Belum ada kalender — halaman kalender kerja di portal menampilkan “belum diunggah”.
			</p>
		{/if}
	</section>

	<form method="POST" action="?/unggah" enctype="multipart/form-data" class="card space-y-4 p-4">
		<h2 class="font-semibold">Unggah kalender baru</h2>
		<FormAlert message={upload?.errors?._form} />
		<div>
			<label class="label" for="gambar">Gambar</label>
			<input
				id="gambar"
				class="block w-full text-sm"
				type="file"
				name="gambar"
				accept="image/jpeg,image/png,image/webp"
				required
			/>
			{#if upload?.errors?.gambar}<p class="field-error">{upload.errors.gambar}</p>{/if}
			{#if upload?.hadFile && !upload.errors?.gambar}
				<p class="field-error">
					Pilih ulang gambarnya — berkas tidak ikut terkirim ulang setelah ada isian yang salah.
				</p>
			{/if}
			<p class="hint">
				JPG, PNG, atau WebP, maks. 15 MB. Disimpan WebP (sisi terpanjang maks. 2000 px).
			</p>
		</div>
		<div>
			<label class="label" for="judul"
				>Nama <span class="text-muted font-normal">(opsional)</span></label
			>
			<input
				id="judul"
				class="input {upload?.errors?.judul ? 'input-error' : ''}"
				name="judul"
				value={upload?.values?.judul ?? ''}
				maxlength="100"
				placeholder="mis. Kalender kerja 2027"
			/>
			{#if upload?.errors?.judul}<p class="field-error">{upload.errors.judul}</p>{/if}
			<p class="hint">
				Untuk riwayat di dashboard saja, tidak tampil di portal. Kosong = “Kalender kerja
				&lt;tanggal hari ini&gt;”.
			</p>
		</div>
		<button class="btn btn-primary w-full">Unggah &amp; tampilkan di portal</button>
		<p class="hint">Kalender yang baru diunggah langsung menggantikan yang sedang tampil.</p>
	</form>
</div>

<h2 class="mt-8 mb-1 text-lg font-semibold">Riwayat</h2>
<p class="text-muted mb-3 text-sm">
	Versi sebelumnya tetap tersimpan. “Jadikan aktif” menampilkannya lagi di portal.
</p>

<div class="card overflow-x-auto">
	<table class="w-full text-left text-sm">
		<thead class="border-line bg-surface text-muted border-b text-xs tracking-wide uppercase">
			<tr>
				<th class="px-4 py-2.5 font-medium"><span class="sr-only">Pratinjau</span></th>
				<th class="px-4 py-2.5 font-medium">Nama</th>
				<th class="px-4 py-2.5 font-medium" title="Diunggah atau terakhir dijadikan aktif">Waktu</th
				>
				<th class="px-4 py-2.5 font-medium">Ukuran</th>
				<th class="px-4 py-2.5"><span class="sr-only">Aksi</span></th>
			</tr>
		</thead>
		<tbody class="divide-line divide-y">
			{#each history as c (c.file)}
				<tr class="hover:bg-surface">
					<td class="px-4 py-2">
						<a href={c.preview} target="_blank" rel="noopener" title="Buka ukuran penuh">
							<img
								src={c.thumb}
								alt=""
								loading="lazy"
								decoding="async"
								class="border-line bg-surface h-14 w-auto max-w-24 rounded border object-contain"
							/>
						</a>
					</td>
					<td class="px-4 py-2 font-medium">{c.title}</td>
					<td class="text-muted px-4 py-2 text-xs whitespace-nowrap">{c.date}</td>
					<td class="text-muted px-4 py-2 text-xs whitespace-nowrap">{c.size}</td>
					<td class="px-4 py-2 text-right whitespace-nowrap">
						<form method="POST" action="?/aktifkan" class="mr-3 inline">
							<input type="hidden" name="berkas" value={c.file} />
							<button class="btn">Jadikan aktif</button>
						</form>
						<a class="text-danger hover:underline" href={deleteHref(c.file)}>Hapus</a>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5" class="text-muted px-4 py-8 text-center">
						{active ? 'Belum ada versi sebelumnya.' : 'Belum ada kalender.'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<p class="text-muted mt-2 text-xs">
	Urutan menurut waktu diunggah atau terakhir dijadikan aktif — portal selalu menampilkan yang
	paling atas.
</p>
