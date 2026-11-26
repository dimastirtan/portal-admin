<script lang="ts">
	import FormAlert from '$lib/components/FormAlert.svelte';

	let { data, form } = $props();
	const b = $derived(data.item);
</script>

<svelte:head><title>Hapus buletin — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/buletin">‹ Buletin</a></p>
<h1 class="mb-4 text-2xl font-semibold">Hapus buletin?</h1>

<form method="POST" class="card border-danger/40 max-w-2xl space-y-4 p-6">
	<FormAlert message={form?.error} />
	<div class="flex flex-wrap items-start gap-4">
		<img
			src={b.thumb}
			alt=""
			class="border-line bg-surface h-40 w-auto max-w-32 rounded border object-contain"
		/>
		<dl class="grid flex-1 grid-cols-[6rem_1fr] gap-y-2 text-sm">
			<dt class="text-muted">Judul</dt>
			<dd class="font-medium">{b.title}</dd>
			<dt class="text-muted">Tanggal</dt>
			<dd>{b.date}</dd>
			<dt class="text-muted">Ukuran</dt>
			<dd>{b.size}</dd>
		</dl>
	</div>
	<ul class="text-muted list-disc space-y-1 pl-5 text-sm">
		{#if b.shown}
			<li class="text-warn">
				Buletin ini <strong>sedang tampil di Information center</strong> portal.
				{#if data.next}
					Setelah dihapus, “{data.next}” ikut tampil menggantikannya.
				{/if}
			</li>
		{/if}
		<li>Berkas posternya dihapus dari folder unggahan. Tidak bisa dibatalkan.</li>
	</ul>
	<div class="flex gap-2">
		<button class="btn btn-danger">Ya, hapus</button>
		<a class="btn" href="/buletin">Batal</a>
	</div>
</form>
