<script lang="ts">
	import HeadlineForm from '$lib/components/HeadlineForm.svelte';

	let { data, form } = $props();

	const values = $derived(form?.values ?? data.values);
</script>

<svelte:head><title>Ubah headline — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/headline">‹ Headline</a></p>
<div class="mb-4 flex max-w-3xl flex-wrap items-baseline gap-3">
	<h1 class="text-2xl font-semibold">Ubah headline</h1>
	<span class="text-muted text-xs">#{data.headline.id}</span>
	{#if data.portalUrl}
		<a class="link text-sm" href={data.portalUrl} target="_blank" rel="noopener"
			>Lihat di portal ↗</a
		>
	{/if}
	<a class="text-danger ml-auto text-sm hover:underline" href="/headline/{data.headline.id}/hapus"
		>Hapus headline ini</a
	>
</div>

{#if data.plain && data.headline.isHtml && !form}
	<p class="border-brand/30 bg-surface mb-4 max-w-3xl rounded-md border px-3 py-2 text-sm">
		Isi HTML lama sudah diubah jadi teks polos di bawah — <strong>belum tersimpan</strong>. Periksa
		hasilnya, lalu klik "Simpan perubahan".
		<a class="link" href="/headline/{data.headline.id}">Batalkan</a>
	</p>
{/if}

<HeadlineForm
	{values}
	errors={form?.errors}
	hadFile={form?.hadFile}
	limits={data.limits}
	parents={data.parents}
	image={data.image}
	imageFallback={data.imageFallback}
	convertHref={values.format === 'html' ? `/headline/${data.headline.id}?polos` : null}
	submit="Simpan perubahan"
/>
