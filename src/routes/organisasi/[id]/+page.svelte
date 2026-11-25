<script lang="ts">
	import OrgForm from '$lib/components/OrgForm.svelte';

	let { data, form } = $props();
	const u = $derived(data.unit);
</script>

<svelte:head><title>Ubah unit — Admin Portal DITTEK</title></svelte:head>

<p class="mb-1 text-sm"><a class="link" href="/organisasi">‹ Organisasi</a></p>
<div class="mb-4 flex max-w-2xl flex-wrap items-baseline gap-3">
	<h1 class="text-2xl font-semibold">Ubah unit</h1>
	<span class="text-muted text-xs">
		#{u.id} · terakhir diubah {u.entryBy || '—'}{u.entryAt ? `, ${u.entryAt}` : ''}
	</span>
	<a class="text-danger ml-auto text-sm hover:underline" href="/organisasi/{u.id}/hapus"
		>Hapus unit ini</a
	>
</div>

<OrgForm
	kind="unit"
	values={form?.values ?? { title: u.title, nik: u.nik, type: u.type }}
	errors={form?.errors}
	hadFile={form?.hadFile}
	maxTitle={data.limits.unitTitle}
	employees={data.employees}
	photo={u.foto}
	submit="Simpan perubahan"
	cancel="/organisasi"
/>

<section class="card mt-6 max-w-2xl">
	<header class="border-line flex items-center gap-3 border-b px-4 py-3">
		<h2 class="font-semibold">Departemen ({u.departments.length})</h2>
		<a class="btn ml-auto" href="/organisasi/{u.id}/departemen/baru">+ Departemen</a>
	</header>
	{#if u.departments.length}
		<ul class="divide-line divide-y text-sm">
			{#each u.departments as d (d.id)}
				<li class="flex items-center gap-3 px-4 py-2">
					<span class="min-w-0 flex-1">
						<a class="link font-medium" href="/organisasi/{u.id}/departemen/{d.id}"
							>{d.title || '(tanpa nama)'}</a
						>
						<span class="text-muted block text-xs">{d.head || (d.nik ? `NIK ${d.nik}` : '—')}</span>
					</span>
					<a class="text-danger hover:underline" href="/organisasi/{u.id}/departemen/{d.id}/hapus"
						>Hapus</a
					>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-muted px-4 py-3 text-sm">Belum ada departemen.</p>
	{/if}
</section>
