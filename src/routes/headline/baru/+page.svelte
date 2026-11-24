<script lang="ts">
	import HeadlineForm from '$lib/components/HeadlineForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Tambah headline — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/headline">‹ Headline</a></p>
<h1 class="mb-4 text-2xl font-semibold">Tambah headline</h1>

<HeadlineForm
	values={form?.values ?? { title: '', date: data.today, text: '', format: 'text', parent: 'baru' }}
	errors={form?.errors}
	hadFile={form?.hadFile}
	limits={data.limits}
	parents={data.parents}
	submit="Simpan"
/>
