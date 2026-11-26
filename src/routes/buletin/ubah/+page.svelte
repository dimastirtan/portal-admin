<script lang="ts">
	import BuletinForm from '$lib/components/BuletinForm.svelte';

	let { data, form } = $props();
	const b = $derived(data.item);
</script>

<svelte:head><title>Ubah buletin — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/buletin">‹ Buletin</a></p>
<div class="mb-4 flex max-w-3xl flex-wrap items-baseline gap-3">
	<h1 class="text-2xl font-semibold">Ubah buletin</h1>
	<span class="text-muted text-xs">
		{b.shown ? `tampil di portal, urutan ${b.rank}` : `urutan ${b.rank}`} · {b.date}
	</span>
	<a
		class="text-danger ml-auto text-sm hover:underline"
		href="/buletin/hapus?berkas={encodeURIComponent(b.file)}">Hapus buletin ini</a
	>
</div>

<BuletinForm
	judul={form?.values.judul ?? b.title}
	tanggal={form?.values.tanggal ?? b.day}
	today={data.today}
	errors={form?.errors}
	hadFile={form?.hadFile}
	current={b}
	submit="Simpan perubahan"
/>
