<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';

	let { data, form } = $props();
	const d = $derived(data.dept);
</script>

<svelte:head><title>Hapus departemen — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/organisasi">‹ Organisasi</a></p>
<h1 class="mb-4 text-2xl font-semibold">Hapus departemen?</h1>

<form method="POST" class="card border-danger/40 max-w-2xl space-y-4 p-6">
	<FormAlert message={form?.error} />
	<dl class="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
		<dt class="text-muted">Departemen</dt>
		<dd class="font-medium">{d.title}</dd>
		<dt class="text-muted">Pejabat</dt>
		<dd>{d.head || (d.nik ? `NIK ${d.nik}` : '—')}</dd>
	</dl>
	<p class="text-muted text-sm">
		Departemen hilang dari bagan organisasi portal{d.foto.kind === 'upload'
			? ', foto unggahannya ikut dihapus'
			: ''}. Tidak bisa dibatalkan.
	</p>
	<div class="flex gap-2">
		<button class="btn btn-danger">Ya, hapus</button>
		<a class="btn" href="/organisasi/{d.orgId}/departemen/{d.id}">Batal</a>
	</div>
</form>
