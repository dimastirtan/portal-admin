<script lang="ts">
	import TelpForm from '$lib/components/TelpForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Ubah nomor — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/telepon">‹ Telepon</a></p>
<div class="mb-4 flex max-w-2xl flex-wrap items-baseline gap-3">
	<h1 class="text-2xl font-semibold">Ubah nomor telepon</h1>
	<span class="text-muted text-xs">
		#{data.telp.id} · terakhir diubah {data.telp.entryBy || '—'}{data.telp.entryAt
			? `, ${data.telp.entryAt}`
			: ''}
	</span>
	<a class="text-danger ml-auto text-sm hover:underline" href="/telepon/{data.telp.id}/hapus"
		>Hapus nomor ini</a
	>
</div>

{#if !data.telp.shown}
	<p class="border-warn/30 bg-warn-bg text-warn mb-4 max-w-2xl rounded-md border px-3 py-2 text-sm">
		Nomor ini tersimpan dengan {data.telp.categoryLabel.toLowerCase()} sehingga tidak tampil di portal.
		Pilih kelompok lalu simpan untuk menampilkannya.
	</p>
{/if}

<TelpForm
	values={form?.values ?? data.telp}
	errors={form?.errors}
	limits={data.limits}
	submit="Simpan perubahan"
/>
