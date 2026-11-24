<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Hapus nomor — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/telepon">‹ Telepon</a></p>
<h1 class="mb-4 text-2xl font-semibold">Hapus nomor telepon?</h1>

<form method="POST" class="card border-danger/40 max-w-2xl space-y-4 p-6">
	<FormAlert message={form?.error} />
	<dl class="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
		<dt class="text-muted">Nama</dt>
		<dd class="font-medium">{data.telp.title}</dd>
		<dt class="text-muted">Nomor</dt>
		<dd class="font-mono text-xs">{data.telp.no}</dd>
		<dt class="text-muted">Kelompok</dt>
		<dd>{data.telp.categoryLabel}</dd>
	</dl>
	<p class="text-muted text-sm">
		Nomor ini akan hilang dari halaman Telepon Penting di portal. Tidak bisa dibatalkan.
	</p>
	<div class="flex gap-2">
		<button class="btn btn-danger">Ya, hapus</button>
		<a class="btn" href="/telepon/{data.telp.id}">Batal</a>
	</div>
</form>
