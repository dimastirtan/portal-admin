<script lang="ts">
	import LinkForm from '$lib/components/LinkForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Ubah link — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/link">‹ Link</a></p>
<div class="mb-4 flex max-w-2xl flex-wrap items-baseline gap-3">
	<h1 class="text-2xl font-semibold">Ubah link</h1>
	<span class="text-muted text-xs">
		#{data.link.id} · terakhir diubah {data.link.entryBy || '—'}{data.link.entryAt
			? `, ${data.link.entryAt}`
			: ''}
	</span>
	<a class="text-danger ml-auto text-sm hover:underline" href="/link/{data.link.id}/hapus"
		>Hapus link ini</a
	>
</div>

<LinkForm
	values={form?.values ?? data.link}
	errors={form?.errors}
	limits={data.limits}
	submit="Simpan perubahan"
/>
