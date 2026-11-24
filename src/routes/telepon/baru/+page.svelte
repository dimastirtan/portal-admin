<script lang="ts">
	import TelpForm from '$lib/components/TelpForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Tambah nomor — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/telepon">‹ Telepon</a></p>
<h1 class="mb-4 text-2xl font-semibold">Tambah nomor telepon</h1>

<TelpForm
	values={form?.values ?? { category: data.category, title: '', no: '' }}
	errors={form?.errors}
	limits={data.limits}
	submit="Simpan"
/>
