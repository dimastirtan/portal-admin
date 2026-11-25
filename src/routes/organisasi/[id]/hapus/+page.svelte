<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';

	let { data, form } = $props();
	const u = $derived(data.unit);
</script>

<svelte:head><title>Hapus unit — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/organisasi">‹ Organisasi</a></p>
<h1 class="mb-4 text-2xl font-semibold">Hapus unit?</h1>

<form method="POST" class="card border-danger/40 max-w-2xl space-y-4 p-6">
	<FormAlert message={form?.error} />
	<dl class="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
		<dt class="text-muted">Unit</dt>
		<dd class="font-medium">{u.title}</dd>
		<dt class="text-muted">Pejabat</dt>
		<dd>{u.head || '—'}</dd>
	</dl>
	{#if u.departments.length}
		<p class="border-warn/30 bg-warn-bg text-warn rounded-md border px-3 py-2 text-sm">
			Unit ini masih punya {u.departments.length} departemen. Hapus atau pindahkan dulu departemennya
			(lewat halaman ubah departemen), baru unit bisa dihapus.
		</p>
		<a class="btn" href="/organisasi/{u.id}">Kembali</a>
	{:else}
		<p class="text-muted text-sm">
			Unit hilang dari bagan organisasi portal{u.foto.kind === 'upload'
				? ', foto unggahannya ikut dihapus'
				: ''}. Tidak bisa dibatalkan.
		</p>
		<div class="flex gap-2">
			<button class="btn btn-danger">Ya, hapus</button>
			<a class="btn" href="/organisasi/{u.id}">Batal</a>
		</div>
	{/if}
</form>
