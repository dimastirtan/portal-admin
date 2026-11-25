<script lang="ts">
	import OrgForm from '$lib/components/OrgForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Tambah unit — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/organisasi">‹ Organisasi</a></p>
<h1 class="mb-4 text-2xl font-semibold">Tambah unit</h1>

<OrgForm
	kind="unit"
	values={form?.values ?? { title: '', nik: '', type: 1 }}
	errors={form?.errors}
	hadFile={form?.hadFile}
	maxTitle={data.limits.unitTitle}
	employees={data.employees}
	submit="Simpan"
	cancel="/organisasi"
/>
