<script lang="ts">
	import BuletinForm from '$lib/components/BuletinForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Unggah buletin — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/buletin">‹ Buletin</a></p>
<h1 class="mb-4 text-2xl font-semibold">Unggah buletin</h1>

<BuletinForm
	judul={form?.values.judul ?? ''}
	tanggal={form?.values.tanggal ?? data.today}
	today={data.today}
	errors={form?.errors}
	hadFile={form?.hadFile}
	submit="Unggah"
/>
