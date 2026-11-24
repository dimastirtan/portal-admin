<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Hapus link — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/link">‹ Link</a></p>
<h1 class="mb-4 text-2xl font-semibold">Hapus link?</h1>

<form method="POST" class="card border-danger/40 max-w-2xl space-y-4 p-6">
	<FormAlert message={form?.error} />
	<dl class="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
		<dt class="text-muted">Deskripsi</dt>
		<dd class="font-medium">{data.link.desc}</dd>
		<dt class="text-muted">URL</dt>
		<dd class="font-mono text-xs break-all">{data.link.url}</dd>
		<dt class="text-muted">Kategori</dt>
		<dd>{data.link.categoryLabel}</dd>
	</dl>
	<p class="text-muted text-sm">
		Link ini akan hilang dari halaman /link portal. Tidak bisa dibatalkan.
	</p>
	<div class="flex gap-2">
		<button class="btn btn-danger">Ya, hapus</button>
		<a class="btn" href="/link/{data.link.id}">Batal</a>
	</div>
</form>
