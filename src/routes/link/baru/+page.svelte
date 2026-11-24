<script lang="ts">
	import LinkForm from '$lib/components/LinkForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Tambah link — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/link">‹ Link</a></p>
<h1 class="mb-4 text-2xl font-semibold">Tambah link</h1>

<LinkForm
	values={form?.values ?? { category: 1, desc: '', url: '' }}
	errors={form?.errors}
	limits={data.limits}
	submit="Simpan"
/>
