<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';

	let { data, form } = $props();
	const h = $derived(data.headline);
</script>

<svelte:head><title>Hapus headline — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/headline">‹ Headline</a></p>
<h1 class="mb-4 text-2xl font-semibold">Hapus headline?</h1>

<form method="POST" class="card border-danger/40 max-w-2xl space-y-4 p-6">
	<FormAlert message={form?.error} />
	<dl class="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
		<dt class="text-muted">Judul</dt>
		<dd class="font-medium">{h.title}</dd>
		<dt class="text-muted">Tanggal</dt>
		<dd>{h.date || '—'}</dd>
		{#if h.parentTitle && h.parentTitle !== h.title}
			<dt class="text-muted">Berita induk</dt>
			<dd>{h.parentTitle}</dd>
		{/if}
	</dl>
	<ul class="text-muted list-disc space-y-1 pl-5 text-sm">
		<li>Headline hilang dari hero beranda dan halaman Berita Utama portal.</li>
		{#if h.hasImage}<li>Gambar unggahannya ikut dihapus.</li>{/if}
		{#if h.parentGoes}
			<li>Berita induknya ikut dihapus karena tidak punya headline lain.</li>
		{/if}
		<li>Tidak bisa dibatalkan.</li>
	</ul>
	<div class="flex gap-2">
		<button class="btn btn-danger">Ya, hapus</button>
		<a class="btn" href="/headline/{h.id}">Batal</a>
	</div>
</form>
