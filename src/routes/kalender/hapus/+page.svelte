<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';

	let { data, form } = $props();
	const c = $derived(data.item);
</script>

<svelte:head><title>Hapus kalender — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/kalender">‹ Kalender kerja</a></p>
<h1 class="mb-4 text-2xl font-semibold">Hapus kalender?</h1>

<form method="POST" class="card border-danger/40 max-w-2xl space-y-4 p-6">
	<FormAlert message={form?.error} />
	<div class="flex flex-wrap items-start gap-4">
		<img
			src={c.thumb}
			alt=""
			class="border-line bg-surface h-32 w-auto max-w-40 rounded border object-contain"
		/>
		<dl class="grid flex-1 grid-cols-[6rem_1fr] gap-y-2 text-sm">
			<dt class="text-muted">Nama</dt>
			<dd class="font-medium">{c.title}</dd>
			<dt class="text-muted">Waktu</dt>
			<dd>{c.date}</dd>
			<dt class="text-muted">Ukuran</dt>
			<dd>{c.size}</dd>
		</dl>
	</div>
	<ul class="text-muted list-disc space-y-1 pl-5 text-sm">
		{#if c.active}
			<li class="text-warn">
				Kalender ini <strong>sedang tampil di portal</strong>.
				{#if data.next}
					Setelah dihapus, portal menampilkan “{data.next}”.
				{:else}
					Tidak ada versi lain — halaman kalender kerja portal akan kosong.
				{/if}
			</li>
		{/if}
		<li>Berkas gambarnya dihapus dari folder unggahan. Tidak bisa dibatalkan.</li>
	</ul>
	<div class="flex gap-2">
		<button class="btn btn-danger">Ya, hapus</button>
		<a class="btn" href="/kalender">Batal</a>
	</div>
</form>
