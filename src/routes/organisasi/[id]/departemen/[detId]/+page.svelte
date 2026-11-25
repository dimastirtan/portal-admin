<script lang="ts">
	import OrgForm from '$lib/components/OrgForm.svelte';

	let { data, form } = $props();
	const d = $derived(data.dept);
</script>

<svelte:head><title>Ubah departemen — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/organisasi">‹ Organisasi</a></p>
<div class="mb-4 flex max-w-2xl flex-wrap items-baseline gap-3">
	<h1 class="text-2xl font-semibold">Ubah departemen</h1>
	<span class="text-muted text-xs">
		#{d.id} · terakhir diubah {d.entryBy || '—'}{d.entryAt ? `, ${d.entryAt}` : ''}
	</span>
	<a
		class="text-danger ml-auto text-sm hover:underline"
		href="/organisasi/{d.orgId}/departemen/{d.id}/hapus">Hapus departemen ini</a
	>
</div>

<OrgForm
	kind="dept"
	values={form?.values ?? { title: d.title, nik: d.nik, orgId: d.orgId }}
	errors={form?.errors}
	hadFile={form?.hadFile}
	maxTitle={data.limits.deptTitle}
	employees={data.employees}
	units={data.units}
	photo={d.foto}
	submit="Simpan perubahan"
	cancel="/organisasi"
/>
