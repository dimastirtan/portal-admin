<script lang="ts">
	import OrgForm from '$lib/components/OrgForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Tambah departemen — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/organisasi">‹ Organisasi</a></p>
<h1 class="mb-4 text-2xl font-semibold">Tambah departemen</h1>

<OrgForm
	kind="dept"
	values={form?.values ?? { title: '', nik: '', orgId: data.unit.id }}
	errors={form?.errors}
	hadFile={form?.hadFile}
	maxTitle={data.limits.deptTitle}
	employees={data.employees}
	units={data.units}
	submit="Simpan"
	cancel="/organisasi"
/>
